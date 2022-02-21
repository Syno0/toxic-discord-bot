// Tools
const fs = require('fs');
const moment = require("moment");
const logPath = "./all.log";
const errorLogPath = "./error.log"
const globalEnv = require("../config/global");

function addLog(msg){
	let toAdd = moment().format("YYYY-MM-DD HH:mm:ss") + " " + msg + "\n";
	console.log(toAdd);
	if (fs.existsSync(logPath)) {
		let actualContent = fs.readFileSync(logPath);
		actualContent += toAdd;
		fs.writeFileSync(logPath, actualContent, 'utf8');
	} else {
		fs.writeFileSync(logPath, toAdd, 'utf8');
	}
}

function addError(error) {
    let toAdd;
    if (typeof error === "object")
        toAdd = moment().format("YYYY-MM-DD HH:mm:ss") + " " + error.stack + "\n";
    else
        toAdd = "ERROR: " + moment().format("YYYY-MM-DD HH:mm:ss") + " " + error + "\n";
    console.error(toAdd);
    if (fs.existsSync(errorLogPath)) {
        let actualContent = fs.readFileSync(errorLogPath);
        actualContent += toAdd;
        fs.writeFileSync(errorLogPath, actualContent, 'utf8');
    } else {
        fs.writeFileSync(errorLogPath, toAdd, 'utf8');
    }
}

function debugLog(msg){
	if(globalEnv.env == 'develop' || globalEnv.debug)
		console.log("DEBUG => " + msg);
}

module.exports = {
	addLog: function (msg) {
		return addLog(msg);
	},
	addError: function (msg) {
		return addError(msg);
	},
	debugLog: function (msg) {
		return debugLog(msg);
	}
}