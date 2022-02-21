// Sequelize
const models = require('../models/');

// Utils
const leveling = require('../utils/leveling');

module.exports = {
	getHelp: function(data) {
		return "Alors comme ça tu es perdu ?\nAllez je suis sympa je t'aide, tape: ```#!commands``` pour en savoir plus :wink:";
	},
	getLevelSteps: function(page) {
		return leveling.getLevelSteps(page);
	},
	getPingPong: function(data) {
		if (data.instruction.toLowerCase() == "ping")
			return "PING!! Ah non merde PONG!";
		else
			return "PONG!! Ah non putain c'est PING ><\"";
	}
}