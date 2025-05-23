const { Sequelize } = require('sequelize');
require('dotenv').config();

// For Render database
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://carshop_db_user:YOUR_PASSWORD@dpg-d0nivghr0fns7393m2r0-a.oregon-postgres.render.com/carshop_db';

const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        connectTimeout: 60000
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 10000
    },
    retry: {
        max: 5,
        backoffBase: 1000,
        backoffExponent: 1.5,
        timeout: 60000,
        match: [
            'ETIMEDOUT',
            'ECONNREFUSED', 
            'ENETUNREACH',
            'SequelizeConnectionError'
        ]
    },
    logging: console.log
});

// Test the connection
sequelize.authenticate()
    .then(() => {
        console.log('Database connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err.message);
        if (err.original) {
            console.error('Original error:', {
                code: err.original.code,
                errno: err.original.errno,
                syscall: err.original.syscall,
                hostname: err.original.hostname
            });
        }
    });

module.exports = sequelize;