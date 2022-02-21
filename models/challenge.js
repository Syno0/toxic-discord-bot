"use strict";

module.exports = (sequelize, DataTypes) => {
	const Challenge = sequelize.define("Challenge", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		isActive: DataTypes.BOOLEAN,
		isAccepted: DataTypes.BOOLEAN,
		type: DataTypes.ENUM("calculus", "frappy", "askme"),
		mise: DataTypes.INTEGER,
		goodAnswer: DataTypes.STRING
	}, {
		tableName: "Challenge"
	});

	Challenge.associate = models => {
		Challenge.belongsTo(models.Member, {
            foreignKey: 'id_owner_member',
            as: "Owner"
        });

        Challenge.belongsTo(models.Member, {
            foreignKey: 'id_opponent_member',
            as: "Opponent"
        });

        Challenge.belongsTo(models.Member, {
            foreignKey: 'id_winner_member',
            as: "Winner"
        });
	}

	return Challenge;
};