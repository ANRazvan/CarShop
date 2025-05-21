const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance
const sequelize = new Sequelize({
    dialect: 'postgres',
    dialectModule: require('pg'),
    host: 'db.rjlewidauwbneruxdspn.supabase.co',
    port: 5432,
    database: 'postgres',
    username: 'postgres',
    password: process.env.PG_PASSWORD,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        connectTimeout: 30000,
        family: 4
    },
    pool: {
        max: 3,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    logging: (msg) => console.log(`[Database] ${msg}`),
    retry: {
        max: 3,
        backoffBase: 1000,
        backoffExponent: 1.5
    }
});

// Test the connection and export the instance
module.exports = sequelize;
