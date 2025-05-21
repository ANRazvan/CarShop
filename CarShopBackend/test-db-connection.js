const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        connectTimeout: 60000 // 60 seconds timeout
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 10000
    },
    host: 'db.rjlewidauwbneruxdspn.supabase.co',
    port: 5432,
    family: 4 // Force IPv4
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
