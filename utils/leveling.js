// Each step is a level
const levelStep = 5;
const exponent = 4;
const baseXp = 10;
const voiceXpPerMinute = 100;

// Sequelize
const models = require('../models/');

// Database
const db_member = require('../database/member');

// Tools
const helpers = require('../utils/helpers');
const moment = require("moment");

// Discord API client
const client = require("../utils/client");

const logger = require('../utils/logger');
const channelsInfo = require("../config/channels");

async function doXp(msg) {

    let dbMember = await db_member.getDbMember(msg.author);

    let earnedXp = msg.content.length;
    let newXp = dbMember.xp + earnedXp;
    let newLevel = getLevel(dbMember.level, newXp);
    let newMoney = dbMember.money;

    // New level !
    if (newLevel > dbMember.level) {
        newMoney += newLevel;
        let ggMessage = helpers.generateBotAnswer("lvlUp", {
            "__USER__": "<@" + dbMember.appId + ">",
            "__LVL__": newLevel
        });

        client.sendInGivenChan({
        	channel: channelsInfo.toxicChannel,
        	text: ggMessage
        });
    }

    return await dbMember.update({
        xp: newXp,
        level: newLevel,
        money: newMoney
    });
}

async function doVoiceXp(discordMember){

	var now = moment().format("YYYY-MM-DD HH:mm:ss");
	let dbMember = await db_member.getDbMember(discordMember);

	let timeInChannel = 0;
	if(dbMember.enterVoice != null)
		timeInChannel = moment(now).diff(dbMember.enterVoice, "minutes");

	let earnedXp = timeInChannel * voiceXpPerMinute;
	let newXp = dbMember.xp + earnedXp;
	let newLevel = getLevel(dbMember.level, newXp);
	let newMoney = dbMember.money;

	// Level UP !
	if(newLevel > dbMember.level){
		newMoney += 1;
		let ggMessage = helpers.generateBotAnswer("lvlUp", {"__USER__": "<@"+dbMember.appId+">", "__LVL__": newLevel});
		client.sendInGivenChan({
			channel: channelsInfo.toxicChannel,
			text: ggMessage
		});
	}

	await dbMember.update({
		xp: newXp,
		level: newLevel,
		money: newMoney
	});

	return {
		earnedXp: earnedXp,
		timeInChannel: timeInChannel
	};
}

function getLevel(level, xp) {
    let xpNeeded = Math.floor(baseXp * (Math.pow(level, exponent)));
    while (xpNeeded <= xp) {
        level++;
        xpNeeded = Math.floor(baseXp * (Math.pow(level, exponent)));
    }
    return level;
}

function getLevelSteps(page) {
    let answer = "";
    let end = 30 * page;
    let start = end - 30;
    for (let i = start; i <= end; i++) {
        answer += "Level " + (i + 1) + ": " + Math.floor(baseXp * (Math.pow(i, exponent))) + " XP\n";
    }
    return answer;
}

module.exports = {
	doXp: function (msg) {
		logger.debugLog('doXp');
		return doXp(msg);
	},
	doVoiceXp: function (member) {
		logger.debugLog('doVoiceXp');
		return doVoiceXp(member);
	},
	getLevelSteps: function (page) {
		logger.debugLog('getLevelSteps');
		return getLevelSteps(page);
	}
}