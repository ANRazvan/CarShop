const { Sequelize } = require('sequelize');
require('dotenv').config();
const dns = require('dns');
const { promisify } = require('util');

// Promisify DNS functions
const lookup = promisify(dns.lookup);
const resolve6 = promisify(dns.resolve6);

// The hostname we're trying to connect to
const DB_HOST = 'db.rjlewidauwbneruxdspn.supabase.co';
const DB_PORT = 5432;
const IPV6_ADDRESS = '2a05:d014:1c06:5f16:6c10:f2a9:c47e:b8a8';

async function createConnection() {
    try {
        console.log('Creating database connection using IPv6...');
        
        const sequelize = new Sequelize({
            dialect: 'postgres',
            dialectModule: require('pg'),
            host: IPV6_ADDRESS, // Use the known IPv6 address
            port: DB_PORT,
            database: 'postgres',
            username: 'postgres',
            password: process.env.PG_PASSWORD,
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                },
                connectTimeout: 30000,
                family: 6, // Force IPv6
                keepAlive: true
            },
            pool: {
                max: 3,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            logging: (msg) => console.log(`[Database] ${msg}`)
        });
        
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        return sequelize;
    } catch (error) {
        console.error('Failed to create database connection:', error);
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