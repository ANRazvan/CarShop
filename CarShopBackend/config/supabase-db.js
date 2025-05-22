const { Sequelize } = require('sequelize');
require('dotenv').config();
const dns = require('dns');
const { promisify } = require('util');

// Promisify DNS functions
const lookup = promisify(dns.lookup);
const resolve6 = promisify(dns.resolve6);

// The hostname and IPv6 address
const DB_HOST = 'db.rjlewidauwbneruxdspn.supabase.co';
const DB_PORT = 5432;
// Wrap IPv6 address in square brackets for proper connection
const IPV6_ADDRESS = '[2a05:d014:1c06:5f16:6c10:f2a9:c47e:b8a8]';

async function createConnection() {
    try {
        console.log('Creating database connection using IPv6...');
        console.log(`Connecting to: ${IPV6_ADDRESS}:${DB_PORT}`);
        
        const sequelize = new Sequelize({
            dialect: 'postgres',
            dialectModule: require('pg'),
            host: IPV6_ADDRESS,
            port: DB_PORT,
            database: 'postgres',
            username: 'postgres',
            password: process.env.PG_PASSWORD,
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                },
                connectTimeout: 60000, // Increased timeout
                family: 6,
                keepAlive: true
            },
            pool: {
                max: 3,
                min: 0,
                acquire: 60000, // Increased timeout
                idle: 10000
            },
            retry: {
                max: 5,
                timeout: 60000
            },
            logging: (msg) => console.log(`[Database] ${msg}`)
        });
        
        await sequelize.authenticate();
        console.log('Database connection established successfully using IPv6.');
        return sequelize;
    } catch (error) {
        console.error('Failed to create database connection:', {
            error: error.message,
            code: error.original?.code,
            address: error.original?.address,
            stack: error.stack
        });
        throw error;
    }
}

let sequelizeInstance = null;

async function getConnection() {
    if (!sequelizeInstance) {
        sequelizeInstance = await createConnection();
    }
    return sequelizeInstance;
}

module.exports = getConnection;