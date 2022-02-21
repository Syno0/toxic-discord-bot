// ******* Actions ******* //
exports.showProfile = function(result){
    return {
        function: "showProfile",
        user: result[1]
    };
};

exports.help = function(result){
    return {
        function: "help"
    };
};

exports.showCommands = function() {
    let data = {
        function: "showCommands",
        answer: "Voilà les commandes, fais toi plaiz:\n" // Exception for this command, answer is built here
    };

    data.answer += '```';
    for (command in showCommandsObj)
        data.answer += "- #!" + showCommandsObj[command] + "\n";
    data.answer += '```';

    return data;
};

exports.showLevelSteps = function(result){
    let data = {
        page: 1,
        function: "showLevelSteps"
    };

    if(typeof result[1] !== "undefined" && checkValidePagination(result[1], 10))
        data.page = result[1];

    return data;
};

exports.showLeaderboard = function(result) {
    let data = {
        page: 1,
        function: "showLeaderboard"
    };

    if (typeof result[1] !== "undefined") {
        if(result[1].startsWith('<@&') && result[1].endsWith('>') && !isNaN(result[1].substring(3).slice(0, -1)))
            data.role = result[1].substring(3).slice(0, -1);
        else {  
            let options = result[1].split(" ");
            for (let i = 0; i < options.length; i++) {
                if (!isNaN(options[i]) && checkValidePagination(options[i], 10))
                    data.page = parseInt(options[i])
            }
        }
    }

    if (typeof result[2] !== "undefined" && result[2].startsWith('<@&') && result[2].endsWith('>') && !isNaN(result[2].substring(3).slice(0, -1)))
        data.role = result[2].substring(3).slice(0, -1);

    return data;
};

exports.showRichmeter = function(result) {
    let data = {
        page: 1,
        function: "showRichmeter"
    };

    if (typeof result[1] !== "undefined") {

        let options = result[1].split(" ");
        for (let i = 0; i < options.length; i++) {
            if (!isNaN(options[i]) && checkValidePagination(options[i], 10))
                data.page = parseInt(options[i])
        }
    }

    return data;
};

exports.pingPong = function(result){
    return {
        function: "pingPong"
    };
};

exports.calc = function(result) {
    let data = {
        mise: 5,
        state: "",
        function: "calc"
    };

    if (typeof result[1] === "undefined")
        throw new Error("Je crois que tu n'as encore rien pigé --', tape #!commands !");

    switch (result[1]) {
        case "accept":
            data.state = "acceptChallenge";
            break;
        case "reject":
            data.state = "rejectChallenge";
            break;
        case "cancel":
            data.state = "cancelChallenge";
            break;
        case "answer":
            data.state = "answerChallenge";
            if (typeof result[2] != "undefined") {
                if (!isNaN(result[2])) {
                    data.answer = result[2];
                } else {
                    data.error = new Error("La réponse doit être un nombre, idiot !");
                    break;
                }
            } else 
                data.error = new Error("Va me falloir une réponse mon coco!");
            break;
        default:
            if (result[1].substring(0, 2) == "<@" && result[1].substring(result[1].length - 1, result[1].length) == ">") {
                data.opponentID = result[1].substring(2, result[1].length - 1);
                data.state = "startChallenge";
            } else {
                data.error = new Error("Tu dois sélectionner un adversaire en utilisant @ ! (exemple: #!calc @someone 50)");
                break;
            }

            if (typeof result[2] != "undefined") {
                if (!isNaN(result[2])) {
                    data.mise = parseInt(result[2]);
                } else {
                    data.error = new Error("La mise doit être un nombre, idiot ! (exemple: #!calc @someone 50)");
                    break;
                }
            }
            break;
    }
    return data;
};

exports.send = function(result){
    let data = {
        channel: null,
        text: null,
        function: "send"
    };

    if(typeof result[1] !== "undefined")
        data.channel = result[1];

    if(typeof result[2] !== "undefined")
        data.text = result[2];

    return data;
};

exports.give = function(result){
    let data = {
        function: "give",
        user: null,
        amount: null
    };

    if(typeof result[1] !== "undefined")
        data.user = result[1];

    if(typeof result[2] !== "undefined")
        data.amount = parseInt(result[2]);

    return data;
};

let showCommandsObj = {
    "help": "help",
    "pingPong": "ping",
    "showProfile": "profil [user]",
    "showCommands": "commands",
    "showLevelSteps": "showLevels [page]",
    "showLeaderboard": "leaderboard [page] [role]",
    "showRichmeter": "richmeter [page]",
    "give": "give [user] [amount]",
    "calc": "calc [@adversaire|accept|reject|answer] [(mise)|@adversaire|@adversaire|(answer)]"
};

let commands = {
    "showProfile": [
        "profil",
        "profile",
        "profil (.*)",
        "profile (.*)"
    ],
    "help": [
        "help",
        "aide",
        "aidez-moi"
    ],
    "showCommands": [
        "commands",
        "commandes"
    ],
    "showLevelSteps": [
        "showLevels",
        "showLevel",
        "showLevelSteps",
        "showLevelStep",
        "showLevels (.*)",
        "showLevel (.*)",
        "showLevelSteps (.*)",
        "showLevelStep (.*)"
    ],
    "showLeaderboard": [
        "leaderboard",
        "showLeaderboard",
        "kikimeter",
        "leaderboard (.*)",
        "showLeaderboard (.*)",
        "kikimeter (.*)",
        "leaderboard (.*) (.*)",
        "showLeaderboard (.*) (.*)",
        "kikimeter (.*) (.*)"
    ],
    "showRichmeter": [
        "richmeter",
        "richmeter (.*)"
    ],
    "pingPong": [
        "ping",
        "pong"
    ],
    "calc": [
        "calc",
        "calc (.*)",
        "calc (.*) (.*)"
    ],
    "send": [
        "send (.*?) (.*)"
    ],
    "give": [
        "give (.*) (.*)"
    ]
};

function checkValidePagination(value, maxPage){
    let val = parseInt(value);
    return val <= maxPage;
}

// ******* Parse *******
exports.parse = function(instruction){

    let instructionResult = {
        instructionLength: 0
    };

    for (let action in commands) {
        for (let i = 0; i < commands[action].length; i++) {
            let regStr = commands[action][i];
            let regExp = new RegExp(regStr, "ig");
            let result = regExp.exec(instruction);
            if (!result)
                continue;

            /* Get the most complicated instruction found */
            if (instructionResult.instructionLength < regStr.length) {
                instructionResult = {
                    action: action,
                    result: result,
                    instructionLength: regStr.length
                };
            }
        }
    }

    if (typeof instructionResult.action === "undefined")
        throw new Error("C'est pas clair ce que tu dis, articules stp...");

    let data = this[instructionResult.action](instructionResult.result);
    data.instruction = instruction;
    return data;
}

module.exports = exports;
