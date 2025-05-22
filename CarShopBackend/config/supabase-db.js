const { Sequelize } = require('sequelize');
require('dotenv').config();

async function createConnection() {
    try {
        console.log('Creating database connection using transaction pooler...');
        
        const sequelize = new Sequelize({
            dialect: 'postgres',
            dialectModule: require('pg'),
            host: process.env.PG_HOST,
            port: process.env.PG_PORT,
            database: process.env.PG_DATABASE,
            username: process.env.PG_USER,
            password: process.env.PG_PASSWORD,
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                },
                connectTimeout: 30000,
                family: 4,  // Force IPv4 for transaction pooler
                keepAlive: true,
                statement_timeout: 60000
            },
            pool: {
                max: 3,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            retry: {
                max: 3,
                timeout: 30000
            },
            logging: (msg) => console.log(`[Database] ${msg}`)
        });

        await sequelize.authenticate();
        console.log('Database connection established successfully using transaction pooler.');
        return sequelize;
    } catch (error) {
        console.error('Failed to create database connection:', {
            error: error.message,
            code: error.original?.code,
            address: error.original?.address
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