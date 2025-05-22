const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance with proper configuration
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: 'db.rjlewidauwbneruxdspn.supabase.co',
    port: 5432,
    database: 'postgres',
    username: 'postgres',
    password: process.env.PG_PASSWORD, // Make sure this is set
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        connectTimeout: 60000,
        // Remove family: 4 to let the system handle IP resolution
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 10000
    },
    logging: console.log, // Simplified logging
});

// Test the connection
sequelize.authenticate()
    .then(() => {
        console.log('Database connection established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

module.exports = sequelize;