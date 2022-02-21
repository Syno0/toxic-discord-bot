const rolesInfo = require("./config/roles");
const channelsInfo = require("./config/channels");
const newsInfo = require("./config/news");
const gamesInfo = require("./config/games");

// Sequelize
const models = require('./models/');

// Bot
const router = require('./bot/router');

// Utils
const logger = require('./utils/logger');
const leveling = require('./utils/leveling');
const role = require('./utils/role');
const helpers = require('./utils/helpers');
const moment = require('moment');

const CronJob = require('cron').CronJob;

const news = require('./service/news');
const memberCron = require('./service/members');

// Database
const db_member = require('./database/member');

// Bot
const prefix = "#!";
const parser = require('./bot/parser.js');

let logChannel, welcomeChannel, afkChannelID, defaultRole, residentRole, pilierRole, missingRole;

require('./client')().then(({client, guild}) => {

	client.on('ready', async () => {

		// Set default channels
		welcomeChannel = guild.channels.cache.find(channel => channel.name === channelsInfo.welcomeChannel);
		if(!welcomeChannel) {
			await guild.channels.create(channelsInfo.welcomeChannel);
			logger.addLog("Missing channel: " + channelsInfo.welcomeChannel + " in guild, creating one: Please make sure to setup its permission.");
		}

		logChannel = guild.channels.cache.find(channel => channel.name === channelsInfo.logChannel);
		if(!logChannel) {
			await guild.channels.create(channelsInfo.logChannel);
			logger.addLog("Missing channel: " + channelsInfo.logChannel + " in guild, creating one: Please make sure to setup its permission.");
		}

		afkChannelID = guild.afkChannelID;

		// Set default role
		pilierRole = guild.roles.cache.find(role => role.name === rolesInfo.pilier.name);
		if (!pilierRole) {
			pilierRole = await guild.roles.create({
				data: {
					name: rolesInfo.pilier.name,
					color: rolesInfo.pilier.color
				}
			});
			logger.addLog("Missing role: " + rolesInfo.pilier.name + " in guild, creating one: Please make sure to setup its permission.");
		}

		residentRole = guild.roles.cache.find(role => role.name === rolesInfo.resident.name);
		if (!residentRole) {
			residentRole = await guild.roles.create({
				data: {
					name: rolesInfo.resident.name,
					color: rolesInfo.resident.color
				}
			});
			logger.addLog("Missing role: " + rolesInfo.resident.name + " in guild, creating one: Please make sure to setup its permission.");
		}

		defaultRole = guild.roles.cache.find(role => role.name === rolesInfo.default.name);
		if (!defaultRole) {
			defaultRole = await guild.roles.create({
				data: {
					name: rolesInfo.default.name,
					color: rolesInfo.default.color
				}
			});
			logger.addLog("Missing role: " + rolesInfo.default.name + " in guild, creating one: Please make sure to setup its permission.");
		}

		missingRole = guild.roles.cache.find(role => role.name === rolesInfo.missing.name);
		if (!missingRole) {
			missingRole = await guild.roles.create({
				data: {
					name: rolesInfo.missing.name,
					color: rolesInfo.missing.color
				}
			});
			logger.addLog("Missing role: " + rolesInfo.missing.name + " in guild, creating one: Please make sure to setup its permission.");
		}

		// Generate game role
		let gameRole;
		for (var i = 0; i < gamesInfo.length; i++) {
			gameRole = guild.roles.cache.find(role => role.name === gamesInfo[i].rolename);
			if(!gameRole) {
				await guild.roles.create({
					data: {
						name: gamesInfo[i].rolename
					}
				});
				logger.addLog("Missing game role: " + gamesInfo[i].rolename + " in guild, creating one: Please make sure to setup its permission.");
			}
		}

		console.log(`Logged in as ${client.user.tag}!`);

		const job = new CronJob('0 * * * *', () => {
			(async () => {
				console.time("NEWS DURATION");

				// Steam News
				for (var i = 0; i < newsInfo.steam.length; i++) {
					try {
						await news.steamNews(newsInfo.steam[i].id, newsInfo.steam[i].chan);
					} catch(err) {
						console.error("ERROR FOR STEAM NEWS => " + newsInfo.steam[i].game);
						console.error(err.message);
					}
				}

				// Jvc News
				for (var i = 0; i < newsInfo.jvc.length; i++) {
					try {
						await news.jvcNews(newsInfo.jvc[i], newsInfo.jvc[i].chan);
					} catch(err) {
						console.error("ERROR FOR JVC NEWS => " + newsInfo.jvc[i].game);
						console.error(err.error);
					}
				}

				// Missing person
				try {
					await memberCron.checkMissingPersons(guild, missingRole.id, residentRole.id, pilierRole.id);
				} catch(err) {
					console.error(err);
				}

				// Update pseudo in DB
				try {
					await memberCron.updateDbPseudo(guild, missingRole.id, residentRole.id, pilierRole.id);
				} catch(err) {
					console.error(err);
				}

				// Update user game role
				try {
					await memberCron.updateGameRole(guild, missingRole.id, residentRole.id, pilierRole.id);
				} catch(err) {
					console.error(err);
				}

				console.timeEnd("NEWS DURATION");
			})().catch(err => {
				console.error(err);
			});
		});
		job.start();

		// Check missing on start
		setTimeout(function(){
			try {
				memberCron.checkMissingPersons(guild, missingRole.id, residentRole.id, pilierRole.id);
				memberCron.updateDbPseudo(guild);
				memberCron.updateGameRole(guild);
			} catch(err) {
				console.error(err);
			}
		}, 3000);
	});

	client.on('guildMemberAdd', member => {
		logger.debugLog('------ guildMemberAdd ------');
		(async () => {
			await member.roles.add(defaultRole);

			// Remove to avoid double call at the same time with getDbMember that trigger simultaneously the addNewMember fn
			await db_member.addNewMember(member.user);

			// Welcome message
			var welcomeMsg = helpers.generateBotAnswer("newArrival", {
				"__ARRIVALUSERID__": member.user.id,
				"__NOOTID__": "214087533208928256"
			})
			welcomeChannel.send(welcomeMsg);

			logger.debugLog('------ guildMemberAdd END ------');
		})().catch(err => {
			logger.addError(err);
		})
	});

	client.on('message', msg => {
		(async () => {
			if (msg.author.bot)
				return;

			logger.debugLog('------ message ------');

			// Check if we have to remove the Missing role
			await role.checkToRemoveMissingPerson(msg.member, missingRole.id, residentRole.id, pilierRole.id);

			// Check if we have to add the Resident role
			await role.checkToAddResident(msg.member, residentRole.id);

			// Check if we have to add the Pilier de bar role
			await role.checkToAddPilier(msg.member, pilierRole.id);

			// It is not a bot command
			if (msg.content.substring(0, 2) != prefix){
				await leveling.doXp(msg); // Add text XP
				return logger.debugLog('------ message END 2 ------');
			}

			let command = msg.content.substring(2);
			let data = parser.parse(command);

			if(data.error)
				throw data.error;

			data.msg = msg;

			// Routing command
			let answer = await router[data.function](data);

			if (Array.isArray(answer)) {
				for (var i = 0; i < answer.length; i++) {
					(function(ibis) {
						setTimeout(_ => {
							if (answer[ibis].reply)
								msg.reply(answer[ibis].message);
							else
								msg.channel.send(answer[ibis].message);
						}, answer[ibis].wait || 0);
					})(i);
				}
			} else if (typeof answer === "object") {
				if (answer.reply)
					msg.reply(answer.message);
				else
					msg.channel.send(answer.message);
			} else if(answer === true) {
				msg.reply("OK !");
			} else {
				msg.reply(answer);
			}

			logger.debugLog('------ message END 3 ------');
		})().catch(err => {
			logger.addError(err);
			msg.reply(err.message || "Désolé, une erreur s'est produite... Voit avec Syno ! Niark niark.");
		});
	});

	client.on('voiceStateUpdate', (oldState, newState) => {
		(async () => {

			let oldMember = oldState.member;
			let newMember = newState.member;

			if (oldMember.user.bot || newMember.user.bot)
				return false;

			logger.debugLog('------ voiceStateUpdate ------');

			let oldUserChannel = oldState.channel;
			let newUserChannel = newState.channel;

			let newChanMembers = [];
			let oldChanMembers = [];

			if (newUserChannel)
				newChanMembers = newUserChannel.members.array();
			if (oldUserChannel)
				oldChanMembers = oldUserChannel.members.array();

			// Start XP earning on someone that was alone in a voice chan
			async function notAloneAnymore(arrivingMember, membersInChan) {

				// Looking for the user that was alone
				const aloneMember = membersInChan.filter(x => x.id != arrivingMember.user.id)[0].user;

				// Start XP earning for the guys that was alone
				await db_member.enterVoiceChannel(aloneMember)

				let msg = moment().format("HH:mm:ss") + ": " + aloneMember.username + " was alone in " + newUserChannel.name + ". But " + arrivingMember.user.username + " join him/her.";
				logger.addLog(msg);
				logChannel.send(msg);
			}

			// Stop XP earning on someone that become alone in a voice chan
			async function foreverAlone(theAloneGuy) {
				const xpInfos = await leveling.doVoiceXp(theAloneGuy.user);

				const member = await db_member.leaveVoiceChannel(theAloneGuy.user, xpInfos.timeInChannel);

				let answer = moment().format("HH:mm:ss") + ": " + theAloneGuy.user.username + " now alone in " + oldUserChannel.name + ". LvL " + member.level + " -> " + member.xp + " total XP ( " + xpInfos.timeInChannel + " min = " + xpInfos.earnedXp + " XP ).";
				logger.addLog(answer);
				logChannel.send(answer);
			}

			// An user join an active voice channel
			if (!oldUserChannel && newUserChannel) {
				// Check if we have to remove the Missing role
				await role.checkToRemoveMissingPerson(newMember, missingRole.id, residentRole.id, pilierRole.id);

				// Check if we have to add the Résident role
				await role.checkToAddResident(newMember, residentRole.id);

				// Check if we have to add the Pilier de bar role
				await role.checkToAddPilier(newMember, pilierRole.id);

				// IF the user join AFK chan then we stop here
				if (newUserChannel.id == afkChannelID)
					return logger.debugLog('------ voiceStateUpdate END 1 ------');

				// The user is alone, we stop here too
				if (newChanMembers.length <= 1)
					return logger.debugLog('------ voiceStateUpdate END 2 ------');

				// A user was alone before the new user arrive, so we need to start XP for this guy too
				if (newChanMembers.length == 2)
					notAloneAnymore(newMember, newChanMembers);

				await db_member.enterVoiceChannel(newMember.user);

				let msg = moment().format("HH:mm:ss") + ": " + newMember.user.username + " join " + newUserChannel.name + ".";
				logger.addLog(msg);
				logChannel.send(msg);
			}
			// User leave totally Discord by disconnecting
			else if (!newUserChannel) {

				// User leave discord and was already in AFK chan, then we don't care go away captain !
				if (oldUserChannel.id == afkChannelID)
					return logger.debugLog('------ voiceStateUpdate END 3 ------');

				// Leaving a guy behind alone :'(
				if (oldChanMembers.length == 1)
					await foreverAlone(oldChanMembers[0]);

				let xpInfos = await leveling.doVoiceXp(oldMember.user);

				const dbMember = await db_member.leaveVoiceChannel(oldMember.user, xpInfos.timeInChannel);

				let msg = moment().format("HH:mm:ss") + ": " + oldMember.user.username + " leave " + oldUserChannel.name + ". LvL " + dbMember.level + " -> " + dbMember.xp + " total XP ( " + xpInfos.timeInChannel + "min = " + xpInfos.earnedXp + " XP ). Now disconnected.";
				logger.addLog(msg);
				logChannel.send(msg);
			}
			// Handling switch between voice chan
			else {
				// Come from AFK chan and not alone in new chan
				if (oldUserChannel.id == afkChannelID && newChanMembers.length > 1) {
					await db_member.enterVoiceChannel(newMember.user);
					let msg = moment().format("HH:mm:ss") + ": " + newMember.user.username + " join " + newUserChannel.name + ".";
					logger.addLog(msg);
					logChannel.send(msg);
				}
				// Go in AFK from other voice chan
				else if (oldUserChannel !== undefined && newUserChannel.id == afkChannelID && oldChanMembers.length >= 1) {
					const xpInfos = await leveling.doVoiceXp(oldMember.user);
					const dbMember = await db_member.leaveVoiceChannel(newMember.user, xpInfos.timeInChannel);
					let answer = moment().format("HH:mm:ss") + ": " + oldMember.user.username + " leave " + oldUserChannel.name + ". LvL " + dbMember.level + " -> " + dbMember.xp + " total XP ( " + xpInfos.timeInChannel + " min = " + xpInfos.earnedXp + " XP ). Now AFK.";
					logger.addLog(answer);
					logChannel.send(answer);
				}

				// Check if in the old chan there is now a alone guy that we'll stop XP earning
				if (oldChanMembers.length == 1 && oldChanMembers[0].user.id != newMember.user.id)
					await foreverAlone(oldChanMembers[0]);

				// New channel handling, if it's AFK then we stop here
				if (newUserChannel.id == afkChannelID)
					return logger.debugLog('------ voiceStateUpdate END 4 ------');

				// Check if in the new chan there is a alone guy that need XP
				if (newChanMembers.length == 2 && (newUserChannel.id != oldUserChannel.id))
					await notAloneAnymore(newMember, newChanMembers);

				// Check if the guy that switch was alone in the old chan to activate XP
				if (oldChanMembers.length == 0 && newChanMembers.length >= 2 && oldUserChannel.id != afkChannelID) {
					await db_member.enterVoiceChannel(newMember.user);
					let msg = moment().format("HH:mm:ss") + ": Member " + oldMember.user.username + " not alone anymore: he join " + newUserChannel.name + " with others.";
					logger.addLog(msg);
					logChannel.send(msg);
				}

				// Check if the guy go alone in another voice chan
				if ((newChanMembers.length == 1 && oldChanMembers.length >= 1) && (newUserChannel.id != oldUserChannel.id))
					await foreverAlone(newChanMembers[0]);
			}

			logger.debugLog('------ voiceStateUpdate END 5 ------');
		})().catch(err => {
			logger.addError(err);
		});
	});
});

if(process.argv[2] == 'moneysync') {
	console.log("moneysync");
	models.Member.findAll().then(members => {
		for (let i = 0; i < members.length; i++) {
			members[i].update({
				money: 100 + parseInt(members[i].level)
			});
		}
	})
}