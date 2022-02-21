'use strict';

// Sequelize
const models = require('../models/');
const moment = require("moment");
const logger = require('../utils/logger');

async function addNewChallenge(newChallenge) {
    return await models.Challenge.create(newChallenge);
}

async function getActiveChallengeByMemberId(id) {
    return await models.Challenge.findOne({
        where: {
            isActive: 1,
            $or: [{
                id_owner_member: id
            }, {
                id_opponent_member: id
            }]
        }
    });
}

async function getActiveChallengeByOpponentId(id) {
    return await models.Challenge.findOne({
        where: {
            isActive: 1,
            id_opponent_member: id
        }
    });
}

async function getActiveChallengeByOwnerId(id) {
    return await models.Challenge.findOne({
        where: {
            isActive: 1,
            id_owner_member: id
        }
    });
}

async function acceptChallenge(id) {
    let challengeToAccept = await models.Challenge.findById(id);
    if (challengeToAccept.isAccepted)
        return new Error("Ce challenge a déjà été accepté !");

    return await challengeToAccept.update({
        isAccepted: 1
    })
}

module.exports = {
    getActiveChallengeByMemberId: function(id) {
        logger.debugLog('getActiveChallengeByMemberId');
        return getActiveChallengeByMemberId(id);
    },
    getActiveChallengeByOpponentId: function(id) {
        logger.debugLog('getActiveChallengeByOpponentId');
        return getActiveChallengeByOpponentId(id);
    },
    getActiveChallengeByOwnerId: function(id) {
        logger.debugLog('getActiveChallengeByOwnerId');
        return getActiveChallengeByOwnerId(id);
    },
    addNewChallenge: function(newChallenge) {
        logger.debugLog('addNewChallenge');
        return addNewChallenge(newChallenge);
    },
    acceptChallenge: function(id) {
        logger.debugLog('acceptChallenge');
        return acceptChallenge(id);
    }
}