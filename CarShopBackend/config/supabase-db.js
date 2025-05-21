const { Sequelize } = require('sequelize');
require('dotenv').config();

const config = {
    dialect: 'postgres',
    dialectModule: require('pg'),
    host: process.env.PG_HOST || 'db.rjlewidauwbneruxdspn.supabase.co',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || 'postgres',
    username: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        connectTimeout: 60000,
        keepAlive: true,
        family: 4 // Force IPv4
    },
    pool: {
        max: 3,
        min: 0,
        acquire: 60000,
        idle: 10000
    },
    retry: {
        max: 5,
        backoffBase: 1000,
        backoffExponent: 1.5
    }
};

let sequelizeInstance = null;

async function getConnection() {
    if (!sequelizeInstance) {
        sequelizeInstance = new Sequelize(config);
    }
    return sequelizeInstance;
}

module.exports = getConnection;