const fs = require('fs');
const moment = require("moment");
const models = require('../models/');
const channelsInfo = require("../config/channels");
const client = require('../utils/client');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');
const gamesInfo = require("../config/games");

async function checkMissingPersons(guild, missingRoleID, residentRoleID, pilierRoleID) {
    logger.debugLog("CRON: checkMissingPersons");
    let oneMonthAgo = moment().subtract(1, 'month').format("YYYY-MM-DD HH:mm:ss");

    const missingPersons = await models.Member.findAll({
        where: {
            updatedAt: {
                $lt: oneMonthAgo
            }
        }
    });

    logger.debugLog("NB FOUND MISSING: " + missingPersons.length);
    for (var i = 0; i < missingPersons.length; i++) {

        let currentMember;
        try {
            currentMember = await guild.members.fetch(missingPersons[i].appId);
        } catch(err) {
            logger.addLog('FETCH MEMBER ('+ missingPersons[i].pseudo +') ERROR => ' + err.message);
            if(err.code == 10007) {
                logger.addLog('Removing member: ' + missingPersons[i].pseudo + ' from DB.');
                models.Member.destroy({
                    where: {
                        id: missingPersons[i].id
                    }
                });
            }
            continue;
        }

        let isResident = currentMember.roles.cache.get(residentRoleID);
        let isPilier = currentMember.roles.cache.get(pilierRoleID);

        if (!isResident && !isPilier)
            continue;

        if(isResident) {
            logger.addLog('Remove role resident on '+ missingPersons[i].pseudo);
            await currentMember.roles.remove(residentRoleID);
        }

        if(isPilier) {
            logger.addLog('Remove role pilier on '+ missingPersons[i].pseudo);
            await currentMember.roles.remove(pilierRoleID);
        }

        await currentMember.roles.add(missingRoleID);

        client.sendInGivenChan({
            channel: channelsInfo.logChannel,
            text: "Nouveau disparu: <@" + missingPersons[i].appId + ">"
        });
    }

    logger.debugLog("CRON END: checkMissingPersons");
}

async function updateDbPseudo(guild) {

    const allUsers = await models.Member.findAll();

    for (var i = 0; i < allUsers.length; i++) {

        let currentMember;
        try {
            currentMember = await guild.members.fetch(allUsers[i].appId);
        } catch(err) {
            logger.addLog('FETCH MEMBER ('+ allUsers[i].pseudo +') ERROR => ' + err.message);
            if(err.code == 10007) {
                logger.addLog('Removing member: ' + allUsers[i].pseudo + ' from DB.');
                models.Member.destroy({
                    where: {
                        id: allUsers[i].id
                    }
                });
            }
            continue;
        }

        if(!currentMember.nickname)
            currentMember.nickname = currentMember.user.username;

        if(currentMember.nickname && currentMember.nickname != '' && currentMember.nickname != allUsers[i].pseudo) {
            console.log("UPDATE USERNAME " + allUsers[i].pseudo + " TO " + currentMember.nickname);
            await allUsers[i].update({
                pseudo: currentMember.nickname
            });
        }
    }
}

async function updateGameRole(guild) {

    const allUsers = await models.Member.findAll();
    for (var i = 0; i < allUsers.length; i++) {

        let currentMember, currentRoles = [];
        try {
            currentMember = await guild.members.fetch(allUsers[i].appId);
        } catch(err) {
            logger.addLog('FETCH MEMBER ('+ allUsers[i].pseudo +') ERROR => ' + err.message);
            if(err.code == 10007) {
                logger.addLog('Removing member: ' + allUsers[i].pseudo + ' from DB.');
                models.Member.destroy({
                    where: {
                        id: allUsers[i].id
                    }
                });
            }
            continue;
        }

        if(!currentMember.presence)
            continue;

        // Loop on activities
        const userActivities = currentMember.presence.activities;
        for (var j = 0; j < userActivities.length; j++) {
            if(gamesInfo.filter(x => x.realnames.filter(y => y == userActivities[j].name).length != 0).length != 0) {
                let game = gamesInfo.filter(x => x.realnames.filter(y => y == userActivities[j].name).length != 0)[0];
                currentMember.roles.cache.each(role => currentRoles.push({
                    id: role.id,
                    name: role.name
                }));

                if(currentRoles.filter(x => x.name == game.rolename).length == 0) {
                    logger.addLog('Add game role : ' + game.rolename + ' to user ' + currentMember.user.username);
                    const roleToAdd = await client.getRoleByName(game.rolename);
                    await currentMember.roles.add(roleToAdd.id);
                }
            }
        }
    }
}

module.exports = {
	checkMissingPersons: async (guild, missingRoleID, residentRoleID, pilierRoleID) => {
        logger.debugLog('checkMissingPersons');
		return await checkMissingPersons(guild, missingRoleID, residentRoleID, pilierRoleID);
	},
    updateDbPseudo: async (guild) => {
        logger.debugLog('updateDbPseudo');
        return await updateDbPseudo(guild);
    },
    updateGameRole: async (guild) => {
        logger.debugLog('updateGameRole');
        return await updateGameRole(guild);
    }
}