const clientInit = require('../client');
const logger = require('../utils/logger');

async function sendInGivenChan(data){
	if(data.msg && data.msg.member.guild.ownerID != data.msg.author.id)
		throw new Error("Tu n'as pas le droit de faire ça.");

	const {client, guild} = await clientInit();

	let currentChan = guild.channels.cache.find(channel => channel.name === data.channel);

	if(!currentChan)
		throw new Error("Channel " + data.channel + " does not exist !");

	currentChan.send(data.text);
	return true;
}

async function getMemberByAppID(appID) {
	const {client, guild} = await clientInit();
    return await guild.members.fetch(appID);
}

async function getRoleByName(rolename) {
	const {client, guild} = await clientInit();
	const allRoles = [];
	const guildRoles = await guild.roles.cache;
	guildRoles.each(role => allRoles.push({
		id: role.id,
		name: role.name
	}));

    return allRoles.filter(x => x.name == rolename)[0];
}

module.exports = {
	sendInGivenChan: async (data) => {
		logger.debugLog('sendInGivenChan');
		return await sendInGivenChan(data);
	},
	getMemberByAppID: async (appID) => {
		logger.debugLog('getMemberByAppID');
		return await getMemberByAppID(appID);
	},
	getRoleByName: async (rolename) => {
		logger.debugLog('getRoleByName');
		return await getRoleByName(rolename);
	}
}