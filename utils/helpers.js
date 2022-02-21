// Tools
const fs = require('fs');
const moment = require("moment");
const grammar = JSON.parse(fs.readFileSync(__dirname + "/../bot/grammar.json"));
const logger = require('../utils/logger');

let previousAnswer = "";

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function generateBotAnswer(key, params){
	if(typeof grammar[key] === "undefined")
		return "Je ne sais pas quoi dire, je ne me sens pas bien, à l'aide !";

	var lengthProba = grammar[key].length;
	var randomIndex = getRandomInt(lengthProba);
	var randomAnswer = grammar[key][randomIndex];

	while(randomAnswer == previousAnswer){
		logger.addLog("Answer already said just before by Toxic, finding a new one.")
		randomIndex = getRandomInt(lengthProba);
		randomAnswer = grammar[key][randomIndex];
	}
	previousAnswer = randomAnswer;

	// Replace params value in string
	for(var key in params){
		var replace = new RegExp(key, "g");
		randomAnswer = randomAnswer.replace(replace, params[key])
	}
	return randomAnswer;
}

function simpleEmbed(content){
	return "```"+content+"```";
}

module.exports = {
	generateBotAnswer: function (key, params) {
		logger.debugLog('generateBotAnswer');
		return generateBotAnswer(key, params);
	},
	simpleEmbed: function (content) {
		logger.debugLog('simpleEmbed');
		return simpleEmbed(content);
	}
}