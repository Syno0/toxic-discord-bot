const fs = require('fs');
const moment = require("moment");
const request = require('request-promise');
const client = require('../utils/client');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');
const getHrefs = require('get-hrefs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
let urlPushed = [];

// News from Steam, setup in steam key in config/news.json
exports.steamNews = async (appID, channel) => {

	logger.debugLog('steamNews');

	let timeout = true;
	setTimeout(function() {
		if (timeout) {
			console.error("REQUEST STEAM TIMEOUT: " + appID);
			return;
		}
	}, 15000);

	let body = await request({
		url: 'http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=' + appID + '&count=5&maxlength=300&format=json',
		timeout: 15000
	});

	timeout = false;
	body = JSON.parse(body);

	let newsUrl;
	for (let i = 0; i < body.appnews.newsitems.length; i++) {
		newsUrl = body.appnews.newsitems[i].url;

		if (newsUrl.indexOf("steam_community_announcements") == -1)
			continue;

		if (moment().diff(moment.unix(body.appnews.newsitems[i].date), "hours") != 0)
			continue;

		// Avoid pushing multiple time the same article (happened when the article is edited or deleted)
		if (urlPushed.indexOf(newsUrl) != -1)
			continue;

		urlPushed.push(newsUrl);

		client.sendInGivenChan({
			channel: channel,
			text: helpers.generateBotAnswer("newNews", {
				"__URL__": newsUrl
			})
		});
	}
}

// News from https://www.jeuxvideo.com, a french gamer news, setup in jvc key in config/news.json
exports.jvcNews = async (game, channel) => {

	logger.debugLog('jvcNews');

	const appID = game.id;
	let body = await request({
		url: 'http://www.jeuxvideo.com/jeux/pc/jeu-' + appID + '/news/',
		timeout: 15000
	});

	let matchHref = getHrefs(body);
	matchHref = matchHref.filter(x => x.startsWith('/news/'));

	for (let i = 0; i < matchHref.length; i++) {
		try {
			let newsUrl = "http://www.jeuxvideo.com" + matchHref[i];

			// Only news href
			if (newsUrl.indexOf(".com/news/") == -1)
				continue;

			let body2 = await request(newsUrl);
			let dom = new JSDOM(body2);
			let datePublish = dom.window.document.querySelector(".articleHeader__publicationDate").getAttribute("datetime");

			if (datePublish && moment().diff(datePublish, "hours") != 0)
				return;

			// Avoid pushing multiple time the same article (happened when the article is edited or deleted)
			if (urlPushed.indexOf(newsUrl) != -1)
				return;

			urlPushed.push(newsUrl);

			client.sendInGivenChan({
				channel: channel,
				text: helpers.generateBotAnswer("newNews", {
					"__URL__": newsUrl
				})
			});

			logger.addLog("News for appID " + appID + " for channel " + channel + " found ! " + newsUrl);
		} catch (err) {
			console.error("ERROR FOR JVC NEWS => " + game.game);
			if(err.statusCode)
				console.log(err.statusCode);
		}
	}
}