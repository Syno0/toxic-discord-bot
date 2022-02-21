// Sequelize
const models = require('../models/');

// Database
const db_member = require('../database/member');

// Tools
const moment = require("moment");
const logger = require('./logger');
const client = require('../utils/client');
const channelsInfo = require("../config/channels");
const helpers = require('../utils/helpers');

// Function to know if we have to add the Resident role to someone
// Resident = 1 month on the server and 1h in a voice chan
async function checkToAddResident(discordMember, residentRoleID, sendMessage = true){

	let isResident = discordMember.roles.cache.get(residentRoleID);

	if(isResident)
		return;

	let dbMember = await db_member.getDbMember(discordMember.user);

	let now = moment();
	let voiceChanTime = dbMember.totalVoiceMinute / 60;
	let timeInServer = moment(now).diff(dbMember.createdAt, "days");

	// One hour in voice chat and 30 days on server and level 10 min
	if(voiceChanTime < 1 || timeInServer < 30 || dbMember.level < 10)
		return false;

	await discordMember.roles.add(residentRoleID);

	if(sendMessage)
		client.sendInGivenChan({
			channel: channelsInfo.toxicChannel,
			text: helpers.generateBotAnswer("newResident", {
	            "__RESIDENTID__": residentRoleID,
	            "__MEMBERID__": dbMember.appId
	        })
		});

	return true;
}

async function checkToAddPilier(discordMember, pilierRoleID, sendMessage = true){

	let isPilier = discordMember.roles.cache.get(pilierRoleID);

	if(isPilier)
		return false;

	let dbMember = await db_member.getDbMember(discordMember);

	// Level 20 min
	if(dbMember.level < 20)
		return false;

	await discordMember.roles.add(pilierRoleID);

	if(sendMessage)
		client.sendInGivenChan({
			channel: channelsInfo.toxicChannel,
			text: helpers.generateBotAnswer("newPilier", {
	            "__PILIERID__": pilierRoleID,
	            "__MEMBERID__": dbMember.appId
	        })
		});

	return true;
}

async function checkToRemoveMissingPerson(discordMember, missingRoleID, residentRoleID, pilierRoleID){
	let wasMissing = discordMember.roles.cache.get(missingRoleID);

	if(!wasMissing)
		return;

	let dbMember = await db_member.getDbMember(discordMember);

	await discordMember.roles.remove(missingRoleID);

	// Add role but without succes message in chan !
	await checkToAddResident(discordMember, residentRoleID, false);
	await checkToAddPilier(discordMember, pilierRoleID, false);

	client.sendInGivenChan({
		channel: channelsInfo.logChannel,
		text: helpers.generateBotAnswer("missingPersonFound", {
            "__FOUNDPERSONID__": dbMember.appId
        })
	});

	return;
}

module.exports = {
	checkToAddResident: function (discordMember, residentRoleID) {
		logger.debugLog('checkToAddResident');
		return checkToAddResident(discordMember, residentRoleID);
	},
	checkToAddPilier: function (discordMember, pilierRoleID) {
		logger.debugLog('checkToAddPilier');
		return checkToAddPilier(discordMember, pilierRoleID);
	},
	checkToRemoveMissingPerson: function (discordMember, missingRoleID, residentRoleID, pilierRoleID) {
		logger.debugLog('checkToRemoveMissingPerson');
		return checkToRemoveMissingPerson(discordMember, missingRoleID, residentRoleID, pilierRoleID);
	}
}
