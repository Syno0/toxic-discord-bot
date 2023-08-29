// Global configuration file
const env = 'develop';

const config = {
	develop: {
		env: 'develop',
		guildID: process.env.guildIDdevelop || '',
		debug: true
	},
	production: {
		env: 'production',
		guildID: process.env.guildIDprod || '',
		debug: false
	}
}

module.exports = config[env]
