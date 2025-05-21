const { Sequelize } = require('sequelize');
require('dotenv').config();
const dns = require('dns');
const { promisify } = require('util');

// Promisify DNS functions
const lookup = promisify(dns.lookup);
const resolve = promisify(dns.resolve);
const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

// The hostname we're trying to connect to
const DB_HOST = 'db.rjlewidauwbneruxdspn.supabase.co';
const DB_PORT = 5432;

// Force IPv4 resolution if possible
dns.setDefaultResultOrder('ipv4first');

// Function to get IP address using various methods
async function getIPAddress() {
    console.log(`Attempting to resolve hostname: ${DB_HOST}`);
    
    try {
        // Try method 1: dns.lookup (uses getaddrinfo under the hood)
        const lookupResult = await lookup(DB_HOST, { all: true });
        console.log('DNS lookup results:', lookupResult);
        
        // Find IPv4 address from lookup
        const ipv4FromLookup = lookupResult.find(entry => entry.family === 4);
        if (ipv4FromLookup) {
            console.log(`Found IPv4 address via lookup: ${ipv4FromLookup.address}`);
            return ipv4FromLookup.address;
        }
        
        // Try method 2: dns.resolve
        const resolveResult = await resolve(DB_HOST);
        console.log('DNS resolve results:', resolveResult);
        if (resolveResult && resolveResult.length > 0) {
            console.log(`Found address via resolve: ${resolveResult[0]}`);
            return resolveResult[0];
        }
        
        // Try method 3: explicitly request IPv4 addresses
        try {
            const ipv4Addresses = await resolve4(DB_HOST);
            if (ipv4Addresses && ipv4Addresses.length > 0) {
                console.log(`Found IPv4 address via resolve4: ${ipv4Addresses[0]}`);
                return ipv4Addresses[0];
            }
        } catch (e) {
            console.log('No IPv4 addresses found via resolve4:', e.message);
        }
        
        // Try method 4: fall back to IPv6 if that's all we have
        try {
            const ipv6Addresses = await resolve6(DB_HOST);
            if (ipv6Addresses && ipv6Addresses.length > 0) {
                console.log(`Warning: Only found IPv6 address: ${ipv6Addresses[0]}`);
                return DB_HOST; // Return hostname, we'll need to handle IPv6
            }
        } catch (e) {
            console.log('No IPv6 addresses found via resolve6:', e.message);
        }
        
        // If we got here, no IP was found
        throw new Error('Could not resolve any IP addresses for the hostname');
        
    } catch (error) {
        console.error('Error resolving hostname:', error);
        // Last resort - try direct connection to hostname
        return DB_HOST;
    }
}

// Create connection using the available IP method
async function createConnection() {
    try {
        // Get best available IP
        const host = await getIPAddress();
        console.log(`Creating database connection to: ${host}`);
        
        // Create Sequelize instance
        const sequelize = new Sequelize({
            dialect: 'postgres',
            dialectModule: require('pg'),
            host: host,
            port: DB_PORT,
            database: 'postgres',
            username: 'postgres',
            password: process.env.PG_PASSWORD,
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                },
                connectTimeout: 60000,
                // Only use family: 4 if we found an IPv4 address
                family: host !== DB_HOST ? 4 : undefined
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
        
        // Test the connection
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        return sequelize;
    } catch (error) {
        console.error('Failed to create database connection:', error);
        throw error;
    }
}

// Alternative approach: Try using a direct connection via pg
async function createDirectPgConnection() {
    const { Client } = require('pg');
    
    console.log('Attempting direct PG connection as fallback');
    
    try {
        // First try with IPv4 approach
        const client = new Client({
            host: DB_HOST,
            port: DB_PORT,
            database: 'postgres',
            user: 'postgres',
            password: process.env.PG_PASSWORD,
            ssl: {
                rejectUnauthorized: false
            },
            family: 4 // Force IPv4
        });
        
        await client.connect();
        console.log('Direct PG connection successful');
        client.end();
        
        // If PG connection worked, create Sequelize with same params
        const sequelize = new Sequelize({
            dialect: 'postgres',
            dialectModule: require('pg'),
            host: DB_HOST,
            port: DB_PORT,
            database: 'postgres',
            username: 'postgres',
            password: process.env.PG_PASSWORD,
            dialectOptions: {
                ssl: {
                    rejectUnauthorized: false
                },
                // Important - explicitly set client application name
                application_name: 'car-shop-app',
                // Don't set family here, let PG handle it
            },
            pool: {
                max: 5,
                min: 0,
                acquire: 60000,
                idle: 10000
            },
            logging: (msg) => console.log(`[Direct Database] ${msg}`),
        });
        
        await sequelize.authenticate();
        console.log('Sequelize connection via direct approach successful');
        return sequelize;
    } catch (directErr) {
        console.error('Direct PG connection failed:', directErr);
        throw directErr;
    }
}

// Try connection with exponential backoff
async function connectWithRetry(maxRetries = 5) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Connection attempt ${attempt} of ${maxRetries}`);
            // Try primary approach
            return await createConnection();
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error.message);
            lastError = error;
            
            if (attempt === maxRetries) {
                console.log('All primary attempts failed, trying direct PG connection...');
                try {
                    return await createDirectPgConnection();
                } catch (pgError) {
                    console.error('Direct PG connection also failed:', pgError.message);
                    throw new Error('All connection methods failed');
                }
            }
            
            // Wait before next retry (exponential backoff)
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s, 16s...
            console.log(`Waiting ${delay}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}

// Initialize and export the connection
let sequelizeInstance = null;

// Externally accessible function to get the connection
// This allows us to handle the async connection initialization
async function getConnection() {
    if (!sequelizeInstance) {
        sequelizeInstance = await connectWithRetry();
    }
    return sequelizeInstance;
}

// Start connection process
getConnection()
    .then(sequelize => {
        console.log('Database connection ready');
    })
    .catch(err => {
        console.error('Fatal database connection error:', err);
        // Consider process.exit(1) here for critical failures
    });

// Export the getter function - consumers must use await
module.exports = getConnection;