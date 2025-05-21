const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        connectTimeout: 60000, // 60 seconds timeout
        // Force IPv4 DNS resolution
        host: 'db.rjlewidauwbneruxdspn.supabase.co'
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 10000
    },
    host: 'db.rjlewidauwbneruxdspn.supabase.co',
    port: 5432,
    family: 4, // Force IPv4
    retry: {
        max: 5 // Maximum number of connection retries
    }
});

// Export the sequelize instance
module.exports = sequelize;
