"use strict";

module.exports = (sequelize, DataTypes) => {
	const Member = sequelize.define("Member", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		pseudo: DataTypes.STRING,
		appId: DataTypes.STRING,
		level: DataTypes.INTEGER,
		xp: DataTypes.INTEGER,
		totalVoiceMinute: DataTypes.INTEGER,
		enterVoice: DataTypes.DATE,
		money: DataTypes.INTEGER
	}, {
		tableName: "Member"
	});

	return Member;
};