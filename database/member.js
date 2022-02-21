// Sequelize
const models = require('../models/');
const moment = require("moment");
const logger = require('../utils/logger');

async function addNewMember(discordMember) {

    if(typeof discordMember.username === 'undefined')
        throw new Error("Ce membre n'est pas valide, j'aime pas son format, j'en veux pas !");

    console.log("addNewMember => " + discordMember.username);

    let dbMember = await models.Member.findOne({
        where: {
            appId: discordMember.id
        }
    });

    if (dbMember) {
        console.log("Member with id " + dbMember.id + " already exist in database.");
        return dbMember;
    }

    // Add security checks
    if (discordMember.username == null) {
        logger.addError(new Error("Member with ID " + discordMember.id + " doesn't have a username !"));
        discordMember.username = "UNKNOWN PSEUDO";
    }

    return await models.Member.create({
        appId: discordMember.id,
        pseudo: discordMember.username,
        level: 0,
        xp: 0,
        totalVoiceMinute: 0,
        money: 100
    });
}

async function getDbMember(discordMember) {
    let dbMember = await models.Member.findOne({
        where: {
            appId: discordMember.id
        }
    });

    if(!dbMember) {
        console.error('Impossible de trouver en DB le membre: ' + discordMember.username);
        return await addNewMember(discordMember);
    }

    return dbMember;
}

async function getMemberById(id) {
    return await models.Member.findById(id);
}

async function enterVoiceChannel(discordMember) {
    let dbMember = await getDbMember(discordMember);

    await dbMember.update({
        enterVoice: moment().format("YYYY-MM-DD HH:mm:ss") // Now
    });

    return dbMember;
}

async function leaveVoiceChannel(discordMember, timeInChannel) {
    let dbMember = await getDbMember(discordMember);

    let newTotalVoiceTime = timeInChannel;

    if (dbMember.totalVoiceMinute != null)
        newTotalVoiceTime = parseInt(dbMember.totalVoiceMinute) + timeInChannel;

    return await dbMember.update({
        enterVoice: null,
        totalVoiceMinute: newTotalVoiceTime
    });
}

async function getMemberLeaderboard() {
    return await models.Member.findAll({
        order: [
            ['xp', 'DESC']
        ]
    });
}

async function getMemberRichmeter() {
    return await models.Member.findAll({
        order: [
            ['money', 'DESC']
        ]
    });
}

async function addXPByMemberId(memberId, nbXP) {
    const dbMember = await models.Member.findById(memberId);

    await dbMember.update({
        xp: parseInt(dbMember.xp) + parseInt(nbXP)
    });
}

async function removeXPByMemberId(memberId, nbXP) {
    const dbMember = await models.Member.findById(memberId);

    await dbMember.update({
        xp: parseInt(dbMember.xp) - parseInt(nbXP)
    });
}

async function addGoldByMemberId(memberId, nbGold) {
    const dbMember = await models.Member.findById(memberId);

    await dbMember.update({
        money: parseInt(dbMember.money) + parseInt(nbGold)
    });
}

async function removeGoldByMemberId(memberId, nbGold) {
    const dbMember = await models.Member.findById(memberId);

    await dbMember.update({
        money: parseInt(dbMember.money) - parseInt(nbGold)
    });
}

module.exports = {
    addNewMember: function(discordMember) {
        logger.debugLog('addNewMember');
        return addNewMember(discordMember);
    },
    getDbMember: function(appId) {
        logger.debugLog('getDbMember');
        return getDbMember(appId);
    },
    getMemberById: function(id) {
        logger.debugLog('getMemberById');
        return getMemberById(id);
    },
    enterVoiceChannel: function(discordMember) {
        logger.debugLog('enterVoiceChannel');
        return enterVoiceChannel(discordMember);
    },
    leaveVoiceChannel: function(discordMember, timeInChannel) {
        logger.debugLog('leaveVoiceChannel');
        return leaveVoiceChannel(discordMember, timeInChannel);
    },
    getMemberLeaderboard: function(all) {
        logger.debugLog('getMemberLeaderboard');
        return getMemberLeaderboard(all);
    },
    getMemberRichmeter: function(all) {
        logger.debugLog('getMemberRichmeter');
        return getMemberRichmeter(all);
    },
    addXPByMemberId: function(memberId, nbXP) {
        logger.debugLog('addXPByMemberId');
        return addXPByMemberId(memberId, nbXP);
    },
    removeXPByMemberId: function(memberId, nbXP) {
        logger.debugLog('removeXPByMemberId');
        return removeXPByMemberId(memberId, nbXP);
    },
    addGoldByMemberId: function(memberId, nbGold) {
        logger.debugLog('addGoldByMemberId');
        return addGoldByMemberId(memberId, nbGold);
    },
    removeGoldByMemberId: function(memberId, nbGold) {
        logger.debugLog('removeGoldByMemberId');
        return removeGoldByMemberId(memberId, nbGold);
    }
}