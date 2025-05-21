const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        connectTimeout: 60000 // 60 seconds timeout
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 10000
    },
    host: 'db.rjlewidauwbneruxdspn.supabase.co',
    port: 5432,
    dialectModule: require('pg'),
    keepDefaultTimezone: true,
    timezone: '+00:00',
    native: false,
    define: {
        timestamps: true
    },    logging: console.log,
    retry: {
        max: 5,
        match: [
            /ConnectionError/,
            /SequelizeConnectionError/,
            /SequelizeConnectionRefusedError/,
            /SequelizeHostNotFoundError/,
            /SequelizeHostNotReachableError/,
            /SequelizeInvalidConnectionError/,
            /SequelizeConnectionTimedOutError/,
            /SequelizeConnectionAcquireTimeoutError/,
            /ETIMEDOUT/,
            /ECONNRESET/,
            /ECONNREFUSED/,
            /ENETUNREACH/
        ]
    }
});

// Export the sequelize instance
module.exports = sequelize;
