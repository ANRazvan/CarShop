const { Sequelize } = require('sequelize');
require('dotenv').config();

async function createConnection() {
    try {
        console.log('Creating database connection using Supabase transaction pooler...');
        
        const sequelize = new Sequelize({
            dialect: 'postgres',
            dialectModule: require('pg'),
            host: process.env.PG_HOST,
            port: parseInt(process.env.PG_PORT),
            database: process.env.PG_DATABASE,
            username: process.env.PG_USER,
            password: process.env.PG_PASSWORD,
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                },
                connectTimeout: 30000,
                // Remove family: 4 - let the system handle IP version
                keepAlive: true,
                statement_timeout: 60000
            },
            pool: {
                max: 5,  // Increased for better performance with pooler
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            retry: {
                max: 3,
                timeout: 30000
            },
            // Disable prepared statements for transaction pooler compatibility
            dialectOptions: {
                ...this.dialectOptions,
                prependSearchPath: true,
            },
            // Add specific options for transaction pooler
            define: {
                timestamps: true,
                underscored: true,
            },
            logging: (msg) => console.log(`[Database] ${msg}`)
        });

        // Test the connection
        await sequelize.authenticate();
        console.log('Database connection established successfully using Supabase transaction pooler.');
        
        return sequelize;
    } catch (error) {
        console.error('Failed to create database connection:', {
            error: error.message,
            code: error.original?.code,
            errno: error.original?.errno,
            syscall: error.original?.syscall,
            address: error.original?.address,
            port: error.original?.port
        });
        throw error;
    }
}

let sequelizeInstance = null;

async function getConnection() {
    if (!sequelizeInstance) {
        sequelizeInstance = await createConnection();
        
        // Handle connection errors and cleanup
        sequelizeInstance.connectionManager.on('error', (error) => {
            console.error('Database connection error:', error);
            sequelizeInstance = null; // Reset instance on error
        });
    }
    return sequelizeInstance;
}

// Graceful shutdown
process.on('SIGINT', async () => {
    if (sequelizeInstance) {
        await sequelizeInstance.close();
        console.log('Database connection closed.');
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    if (sequelizeInstance) {
        await sequelizeInstance.close();
        console.log('Database connection closed.');
    }
    process.exit(0);
});

module.exports = getConnection;