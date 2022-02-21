// Global configuration file
const env = 'develop';

const config = {
	develop: {
		env: 'develop',
		guildID: '', // Your discord guild ID
		debug: true // To logs more stuff
	},
	production: {
		env: 'production',
		guildID: '',
		debug: false
	}
}

module.exports = config[env]
