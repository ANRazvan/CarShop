const { Sequelize } = require('sequelize');
require('dotenv').config();
const dns = require('dns');

// Force IPv4 resolution before any connection attempts
dns.setDefaultResultOrder('ipv4first');

// Direct connection test with pg client
const { Client } = require('pg');
const client = new Client({
  host: 'db.rjlewidauwbneruxdspn.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.PG_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  // Add explicit IPv4 preference
  family: 4
});

client.connect()
  .then(() => console.log('Direct connection successful'))
  .catch(e => console.error('Direct connection error:', e))
  .finally(() => client.end());

// Create Sequelize instance with improved IPv4 handling
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
        // Keep family: 4 to force IPv4
        family: 4
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
        timeout: 60000
    },
    logging: (msg) => console.log(`[Database] ${msg}`),
});

// Implement an alternate connection method if the first one fails
const fallbackConnection = async () => {
    try {
        // Try to resolve IPv4 addresses explicitly
        const addresses = await new Promise((resolve, reject) => {
            dns.resolve4('db.rjlewidauwbneruxdspn.supabase.co', (err, addresses) => {
                if (err) reject(err);
                else resolve(addresses);
            });
        });
        
        if (addresses && addresses.length > 0) {
            console.log(`Attempting fallback connection with IPv4 address: ${addresses[0]}`);
            
            // Create another Sequelize instance with the explicit IPv4 address
            const fallbackSequelize = new Sequelize({
                dialect: 'postgres',
                dialectModule: require('pg'),
                host: addresses[0], // Use the resolved IPv4 address directly
                port: 5432,
                database: 'postgres',
                username: 'postgres',
                password: process.env.PG_PASSWORD,
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
                logging: (msg) => console.log(`[Fallback Database] ${msg}`),
            });
            
            await fallbackSequelize.authenticate();
            console.log('Fallback database connection established successfully.');
            return fallbackSequelize;
        }
        throw new Error('No IPv4 addresses found for database host');
    } catch (error) {
        console.error('Fallback connection failed:', error);
        throw error;
    }
};

// Try primary connection, fall back if needed
let dbInstance = sequelize;
sequelize.authenticate()
    .then(() => {
        console.log('Database connection established successfully.');
    })
    .catch(err => {
        console.error('Primary connection failed, attempting fallback:', err);
        return fallbackConnection()
            .then(fallbackInstance => {
                dbInstance = fallbackInstance;
                console.log('Using fallback connection');
            })
            .catch(fallbackErr => {
                console.error('All connection attempts failed:', fallbackErr);
                // You might want to implement additional error handling here
            });
    });

// Export the instance (will be either primary or fallback)
module.exports = dbInstance;