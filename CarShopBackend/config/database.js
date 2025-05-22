const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance with IPv6 support
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: 'db.rjlewidauwbneruxdspn.supabase.co',
    port: 6543,
    database: 'postgres',
    username: 'postgres',
    password: process.env.PG_PASSWORD,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        connectTimeout: 60000,
        // Explicitly allow IPv6
        family: 6,  // Force IPv6
        hints: require('dns').ADDRINFO_V4MAPPED | require('dns').ADDRCONFIG
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
console.log(' - Database:', 'postgres');
console.log(' - User:', 'postgres');
console.log(' - Host:', 'db.rjlewidauwbneruxdspn.supabase.co');
console.log(' - Port:', 6543);
console.log(' - IPv6 Mode:', 'Enabled');

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