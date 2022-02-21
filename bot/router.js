const general = require('./general');
const member = require('./member');
const challenge = require('./challenge');
const client = require('../utils/client');
const logger = require('../utils/logger');

/* --------------------------------------------------------------- */
/* -------------------------- Client ----------------------------- */
/* --------------------------------------------------------------- */
exports.send = async (data) => {
    return client.sendInGivenChan(data);
}

/* --------------------------------------------------------------- */
/* ------------------------- General ----------------------------- */
/* --------------------------------------------------------------- */
exports.help = async (data) => {
    return general.getHelp(data);
}

exports.showCommands = async (data) => {
    return data.answer;
}

exports.showLevelSteps = async (data) => {
    return general.getLevelSteps(data.page);
}

exports.pingPong = async (data) => {
    return general.getPingPong(data);
}

/* --------------------------------------------------------------- */
/* -------------------------- Member ----------------------------- */
/* --------------------------------------------------------------- */
exports.showProfile = async (data) => {
    return member.getProfile(data);
}

exports.showLeaderboard = async (data) => {
    return member.getLeaderboard(data);
}

exports.showRichmeter = async (data) => {
    return member.getRichmeter(data);
}

exports.give = async (data) => {
    return member.give(data);
}

/* --------------------------------------------------------------- */
/* ------------------------ Challenge ---------------------------- */
/* --------------------------------------------------------------- */
exports.calc = async (data) => {
    switch(data.state){
        case "startChallenge":
            return challenge.startCalc(data);
            break;
        case "acceptChallenge":
            return challenge.acceptCalc(data);
            break;
        case "cancelChallenge":
            return challenge.cancelCalc(data);
            break;
        case "rejectChallenge":
            return challenge.rejectCalc(data);
            break;
        case "answerChallenge":
            return challenge.answerCalc(data);
            break;
        default:
            throw new Error("Une erreur s'est produite.");
    }
}
