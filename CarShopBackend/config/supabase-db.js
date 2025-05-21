const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance
// Parse connection URL to extract host
const { URL } = require('url');
const parsed = new URL(process.env.DATABASE_URL);

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: require('pg'),
    host: parsed.hostname,
    port: parsed.port || 5432,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        connectTimeout: 30000,
        options: {
            trustServerCertificate: true
        },
        // Force IPv4 at the PostgreSQL protocol level
        family: 4
    },
    // Force IPv4 at the pg driver level
    pool: {
        max: 3,
        min: 0,
        acquire: 30000,
        idle: 10000
    },    keepDefaultTimezone: true,
    timezone: '+00:00',
    native: false,
    define: {
        timestamps: true
    },
    // Enhanced logging for connection issues
    logging: (msg) => console.log(`[Database] ${msg}`),
    retry: {
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
