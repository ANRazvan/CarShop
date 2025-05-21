const { Sequelize } = require('sequelize');
require('dotenv').config();

const { Client } = require('pg');
const client = new Client({
  host: 'db.rjlewidauwbneruxdspn.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.PG_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect()
  .then(() => console.log('Direct connection successful'))
  .catch(e => console.error('Direct connection error:', e))
  .finally(() => client.end());

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
        connectTimeout: 60000, // Increased timeout
        family: 4
    },
    pool: {
        max: 5,  // Increased pool size
        min: 0,
        acquire: 60000, // Increased acquire timeout
        idle: 10000
    },
    retry: {
        max: 5,  // Increased retry attempts
        backoffBase: 1000,
        backoffExponent: 1.5,
        timeout: 60000  // Added timeout
    },
    logging: (msg) => console.log(`[Database] ${msg}`),
});

// Test the connection and export the instance
sequelize.authenticate()
    .then(() => {
        console.log('Database connection established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

module.exports = sequelize;
