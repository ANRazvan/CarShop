const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance for Render PostgreSQL
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: 'dpg-d0nivghr0fns7393m2r0-a',
    port: 5432,
    database: 'carshopdatabase',
    username: 'database',
    password: 'ZPEVattPHYXYcQwLPawMwU8A3yBsYpOx',
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
        idle: 10000,
        evict: 60000
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
    logging: (msg) => console.log(`[Database] ${msg}`),
});

console.log('[DATABASE] Connecting to PostgreSQL:');
console.log(' - Database:', 'carshopdatabase');
console.log(' - User:', 'database');
console.log(' - Host:', 'dpg-d0nivghr0fns7393m2r0-a');
console.log(' - Port:', 5432);

// Test the connection with better error handling
sequelize.authenticate()
    .then(() => {
        console.log('Database connection established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
        console.error('Connection details:', {
            code: err.original?.code,
            address: err.original?.address,
            port: err.original?.port,
            syscall: err.original?.syscall
        });
    });

module.exports = sequelize;