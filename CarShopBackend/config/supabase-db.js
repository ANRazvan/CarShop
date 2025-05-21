const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        connectTimeout: 30000, // 30 seconds timeout
        options: {
            trustServerCertificate: true
        },
        family: 4 // Force IPv4
    },
    dialectModule: require('pg'),
    dialectModuleOptions: {
        family: 4 // Force IPv4 both at pg and at Sequelize level
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
    },    logging: console.log,    retry: {
        max: 3, // Maximum 3 retries
        backoffBase: 1000, // Start with 1 second delay
        backoffExponent: 1.5, // Increase delay by this factor each retry
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
            /ENETUNREACH/,
            /getaddrinfo/
        ]
    }});
    
// Test the connection and export the instance
module.exports = sequelize;

// Test the connection and export the instance
module.exports = sequelize;
