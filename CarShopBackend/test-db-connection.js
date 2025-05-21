const { Sequelize } = require('sequelize');
require('dotenv').config();

// Parse connection URL
const { URL } = require('url');
const parsed = new URL(process.env.DATABASE_URL);

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: require('pg'),
    host: parsed.hostname,
    port: parsed.port || 5432,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        connectTimeout: 30000,
        options: {
            trustServerCertificate: true
        },
        family: 4 // Force IPv4
    },
    pool: {
        max: 3,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    retry: {
        max: 3,
        backoffBase: 1000,
        backoffExponent: 1.5,
        timeout: 30000,
        match: [
            'ETIMEDOUT',
            'ECONNREFUSED',
            'ENETUNREACH',
            'SequelizeConnectionError'
        ]
    }
});

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connection has been established successfully.');
        
        // Test a simple query
        const result = await sequelize.query('SELECT NOW()', { type: Sequelize.QueryTypes.SELECT });
        console.log('Current database time:', result[0].now);
    } catch (error) {
        console.error('❌ Unable to connect to the database:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if (error.original) {
            console.error('Original error:', error.original.message);
        }
        console.error('Full error:', error);
    } finally {
        await sequelize.close();
    }
}

testConnection();
