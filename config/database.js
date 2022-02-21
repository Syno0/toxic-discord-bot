// Database configuration file
const globalConf = require('./global');

const databaseConf = {
    develop: {
        host: '127.0.0.1',
        port: '3306',
        user: 'toxic',
        password: 'toxic',
        database: 'toxic'
    },
    production: {
        host: '127.0.0.1',
        port: '3306',
        user: 'toxic',
        password: 'toxic',
        database: 'toxic'
    },
}

module.exports = databaseConf[globalConf.env];