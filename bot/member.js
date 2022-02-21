// Sequelize
const models = require('../models/');

// Database
const db_member = require('../database/member');

const moment = require("moment");
const helpers = require('../utils/helpers');
const client = require('../utils/client');

const roles = require('../config/roles');

// Validated format <@!254928226810331136>
function valideUserId(userId) {
	if(userId.startsWith('<@!') && userId.endsWith('>') && !isNaN(userId.substring(3).slice(0, -1)))
		return true;
	console.log('INVALID USER ID => ' + userId);
	return false;
}

module.exports = {
	getProfile: async function(data) {

		let user = data.msg.author;
		if(data.user && valideUserId(data.user))
			user = {
				id: data.user.substring(3).slice(0, -1)
			}

		let foundMember = await db_member.getDbMember(user);

		let answer = "";
		answer += helpers.generateBotAnswer("profil") + "\n";
		answer += "```Pseudo: " + foundMember.pseudo + "\n";
		answer += "Level: LvL " + foundMember.level + "\n";
		answer += "XP: " + foundMember.xp + " XP\n";
		answer += "Porte-monnaie: " + foundMember.money + " P.O\n";
		answer += "Temps passé en chan vocal: " + foundMember.totalVoiceMinute + " minutes (" + Math.round(foundMember.totalVoiceMinute / 1440) + " jours / " + Math.round(foundMember.totalVoiceMinute / 60) + " heures) \n";
		answer += "Inscrit le: " + moment(foundMember.createdAt).format("DD/MM/YY HH:mm:ss") + "\n```";
		return answer;
	},
	getLeaderboard: async function(data) {
		let answer = "```\n------------------------------------------------------------------------------------------------\n";
		answer += "-------------------------------------- 🌟 LEADERBOARD 🌟 --------------------------------------\n";
		answer += "------------------------------------------------------------------------------------------------\n\n";

		let memberLeaderboard = await db_member.getMemberLeaderboard();

		let end = 15 * data.page;
		let start = end - 15;
		let currentMember, currentRoles, roleToWrite;
		for (let i = start; i < end; i++) {

			currentRoles = [];
			roleToWrite = '';

			if (typeof memberLeaderboard[i] === "undefined")
				break;

			// Generate major role list for each member
			currentMember = await client.getMemberByAppID(memberLeaderboard[i].appId);
			currentMember.roles.cache.each(role => currentRoles.push({
				id: role.id,
				name: role.name
			}));

			// If a role was given as a filter for the list, only show user with this role
			if(data.role && !isNaN(data.role) && currentRoles.filter(x => x.id == data.role).length == 0)
				continue;

			for(let configRole in roles)
				if(currentRoles.filter(x => x.name == roles[configRole].name).length != 0)
					roleToWrite += roles[configRole].name + ' '

			if(memberLeaderboard[i].pseudo.length > 20)
				memberLeaderboard[i].pseudo = memberLeaderboard[i].pseudo.substring(0, 17) + '...';

			if(data.page == 1) {
				if(i == 0){
					memberLeaderboard[i].pseudo = memberLeaderboard[i].pseudo;
				}
				else if(i == 1){
					memberLeaderboard[i].pseudo = memberLeaderboard[i].pseudo;
				}
			}
		
			answer += (i + 1) + ": " + memberLeaderboard[i].pseudo;
			for (let j = 0; j <= 20 - memberLeaderboard[i].pseudo.length - ((i + 1).toString().length); j++) {
				answer += " ";
			}
			answer += " | Level: " + memberLeaderboard[i].level;
			for (let j = 0; j <= 3 - memberLeaderboard[i].level.toString().length; j++) {
				answer += " ";
			}
			answer += " | XP: " + memberLeaderboard[i].xp;
			for (let j = 0; j <= 10 - memberLeaderboard[i].xp.toString().length; j++) {
				answer += " ";
			}
			answer += " | Roles: " + roleToWrite + "\n";
		}
		answer += "```";
		return answer;
	},
	getRichmeter: async function(data) {
		let answer = "```\n---------------------------------------------------------------\n";
		answer += "----------------------- 💰 Richmeter 💰 -----------------------\n";
		answer += "---------------------------------------------------------------\n\n";

		let memberLeaderboard = await db_member.getMemberRichmeter();

		let end = 20 * data.page;
		let start = end - 20;
		let currentMember;
		for (let i = start; i < end; i++) {

			if (typeof memberLeaderboard[i] === "undefined")
				break;

			if(memberLeaderboard[i].pseudo.length > 20)
				memberLeaderboard[i].pseudo = memberLeaderboard[i].pseudo.substring(0, 17) + '...';

			if(data.page == 1) {
				if(i == 0)
					memberLeaderboard[i].pseudo = memberLeaderboard[i].pseudo;
				else if(i == 1)
					memberLeaderboard[i].pseudo = memberLeaderboard[i].pseudo;
			}
	
			answer += (i + 1) + ": " + memberLeaderboard[i].pseudo;
			for (let j = 0; j <= 20 - memberLeaderboard[i].pseudo.length - ((i + 1).toString().length); j++) {
				answer += " ";
			}
			answer += " | Money: " + memberLeaderboard[i].money + " 💲\n";
		}
		answer += "```";
		return answer;
	},
	give: async function(data) {

		if(!data.amount || isNaN(data.amount))
			throw new Error('Un montant peut être ?');
		else if(data.amount <= 0)
			throw new Error('Quel radin tu fais, un vrai montant ça te dirais ?');
		else if(data.amount > 10000)
			throw new Error("Mais oui bien sur, genre t'as la thune.");

		let targetUser;
		if(data.user && valideUserId(data.user))
			targetUser = {
				id: data.user.substring(3).slice(0, -1)
			};
		else
			throw new Error("Le gars à qui tu veux donner n'est pas valide");

		let sourceMember = await db_member.getDbMember(data.msg.author)
		let targetMember = await db_member.getDbMember(targetUser);

		if(sourceMember.id == targetMember.id)
			throw new Error("Tu te sens seul ?");

		if(sourceMember.money < data.amount)
			throw new Error("Désolé tu es trop pauvre pour ce montant !");

		await sourceMember.update({
			money: sourceMember.money - data.amount
		});

		await targetMember.update({
			money: targetMember.money + data.amount
		});

		return "Ok, j'ai donné " + data.amount + " P.O à <@!" + targetUser.id + ">";
	}
}