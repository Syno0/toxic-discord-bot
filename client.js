const globalEnv = require("./config/global");
const Discord = require("discord.js");
// Token
const token = require("./config/token").token;
// Sequelize
const models = require('./models/');

let client, guild;

async function initClient() {
	console.log('Discord Client initialisation');
	// Discord API client
	client = new Discord.Client();

	await models.sequelize.sync({
		logging: false,
		hooks: false
	});

	console.log("Database sync succeed.");
	client.login(token);
	return client;
}

module.exports = async _ => {
	if(client && guild)
		return {client, guild};

	client = await initClient();
	guild = await client.guilds.fetch(globalEnv.guildID);

	return {client, guild};
}