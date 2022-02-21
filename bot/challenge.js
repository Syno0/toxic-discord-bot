// Sequelize
const models = require('../models/');

// Database
const db_member = require('../database/member');
const db_challenge = require('../database/challenge');

const moment = require("moment");

async function startCalc(data) {
    if (typeof data.msg.mentions.users.first().id !== "undefined" && !isNaN(data.msg.mentions.users.first().id)) {
    	data.opponent = data.msg.mentions.users.first();
        data.opponentID = data.opponent.id;
    }
    else
        throw new Error("Tu dois sélectionner un adversaire en utilisant @ !");

    let owner = await db_member.getDbMember(data.msg.member.user)
    let opponent = await db_member.getDbMember(data.opponent);

    if (owner.money < data.mise)
        throw new Error("Désolé mec, mais tu n'as pas assez de thune !");

    if (opponent.money < data.mise)
        throw new Error("Désolé mais ton adversaire est trop pauvre pour cette mise !");

    if (owner.appId == opponent.appId)
        throw new Error("Nope tu ne peux pas te défier toi même ! Par contre tu peux consulter pour schizophrénie...");

    let ownerActiveChallenge = await db_challenge.getActiveChallengeByMemberId(owner.id);
    if (ownerActiveChallenge)
        throw new Error("Tu as déjà un challenge en cours!");

    let opponentActiveChallenge = await db_challenge.getActiveChallengeByMemberId(opponent.id);
    if (opponentActiveChallenge)
        throw new Error("Ton adversaire a déjà un challenge en cours!");

    await db_challenge.addNewChallenge({
        isActive: 1,
        isAccepted: 0,
        type: "calculus",
        mise: data.mise,
        id_owner_member: owner.id,
        id_opponent_member: opponent.id
    });

    return {
        message: "<@" + data.opponentID + "> souhaites tu relever le challenge Calculus de <@" + data.msg.member.user.id + "> pour une mise de " + data.mise + " P.O ?.\nSi oui tu peux taper: #!calc accept. Sinon si tu flippes trop tu peux taper: #!calc reject.",
        reply: false
    };
}

async function cancelCalc(data){
	let owner = await db_member.getDbMember(data.msg.member.user);
	let challenge = await db_challenge.getActiveChallengeByOwnerId(owner.id);
	if(!challenge)
		throw new Error("Vous n'avez aucun challenge en cours!");

	await challenge.update({
		isActive: 0
	});

	return {
		message: "<@"+owner.appId+"> a paniqué et a annulé le challenge !",
		reply: false
	};
}

async function acceptCalc(data){
	let opponentMember = await db_member.getDbMember(data.msg.member.user);
	let challenge = await db_challenge.getActiveChallengeByOpponentId(opponentMember.id);
	if(!challenge)
		throw new Error("Vous n'avez aucun challenge en cours!");

	let ownerMember = await db_member.getMemberById(challenge.id_owner_member);

	await db_challenge.acceptChallenge(challenge.id);
	// Prepare all variables
	let operators = [{
		sign: "+",
		min: 10,
		max: 100,
		method: function(a,b){ return a + b; }
	}, {
		sign: "-",
		min: 10,
		max: 100,
		method: function(a,b){ return a - b; }
	}, {
		sign: "*",
		min: 1,
		max: 20,
		method: function(a,b){ return a * b; }
	}];

	let selectedOperator = Math.floor(Math.random()*operators.length);
	let sign = operators[selectedOperator].sign;
	let min = operators[selectedOperator].min;
	let max = operators[selectedOperator].max;
	let rnum1 = Math.floor(Math.random() * (max - min) + min);
	let rnum2 = Math.floor(Math.random() * (max - min) + min);
	let goodAnswer = operators[selectedOperator].method(rnum1, rnum2);

	await challenge.update({
		goodAnswer: goodAnswer
	});

    return [{
        message: "Ok c'est parti ! Ready <@" + data.msg.member.user.id + ">, <@" + ownerMember.appId + "> ? Pour répondre il faudra faire #!calc answer [TA REPONSE]",
        reply: false
    }, {
        message: "<@" + data.msg.member.user.id + "> FIGHT <@" + ownerMember.appId + "> !! : Combien font " + rnum1 + " " + sign + " " + rnum2 + "?",
        reply: false,
        wait: Math.floor(Math.random() * (15000 - 5000) + 5000)
    }];
}

async function rejectCalc(data){
	let opponentMember = await db_member.getDbMember(data.msg.member.user);

	let challenge = await db_challenge.getActiveChallengeByOpponentId(opponentMember.id);
	if(!challenge)
		throw new Error("Vous n'avez aucun challenge en cours !");

	let ownerMember = await db_member.getMemberById(challenge.id_owner_member);

	await challenge.update({
		isActive: 0
	});

	return {
		message: "<@"+opponentMember.appId+"> ne s'estime pas de taille face à <@"+ownerMember.appId+"> et a donc rejeté le challenge",
		reply: false
	};
}

async function answerCalc(data){
	let dbMember = await db_member.getDbMember(data.msg.member.user);

	let activeChallenge = await db_challenge.getActiveChallengeByMemberId(dbMember.id);
	if (!activeChallenge)
		throw new Error("Tu n'as pas de challenge en cours --'");

	let opponentID = activeChallenge.id_opponent_member;
	if (opponentID == dbMember.id)
		opponentID = activeChallenge.id_owner_member

	let opponent = await db_member.getMemberById(opponentID);
	if (data.answer != activeChallenge.goodAnswer)
		return "Raté, try again !";

	await activeChallenge.update({
		id_winner_member: dbMember.id,
		isActive: 0
	});

	await db_member.addGoldByMemberId(dbMember.id, activeChallenge.mise);
	await db_member.removeGoldByMemberId(opponent.id, activeChallenge.mise);
	await db_member.addXPByMemberId(dbMember.id, 1000);

	return {
		message: "GG à <@" + dbMember.appId + "> qui a gagné le challenge! <@" + opponent.appId + "> te donnes " + activeChallenge.mise + " P.O et tu remportes 1000XP! Niark niark !",
		reply: false
	};
}

module.exports = {
	startCalc: function (data, cb) {
		return startCalc(data, cb);
	},
	cancelCalc: function (data, cb) {
		return cancelCalc(data, cb);
	},
	acceptCalc: function (data, cb) {
		return acceptCalc(data, cb);
	},
	rejectCalc: function (data, cb) {
		return rejectCalc(data, cb);
	},
	answerCalc: function (data, cb) {
		return answerCalc(data, cb);
	}
}