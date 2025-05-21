const { Sequelize } = require('sequelize');
require('dotenv').config();

// This module provides a fallback database configuration
// It attempts to connect to PostgreSQL first, and if that fails,
// it falls back to SQLite which doesn't require a server

// Check if required PostgreSQL environment variables are provided
const hasPgConfig = process.env.PG_HOST && process.env.PG_DATABASE && process.env.PG_USER && process.env.PG_PASSWORD;

// First, attempt PostgreSQL connection if config is available
let sequelize;
let isFallbackMode = false;

if (hasPgConfig) {
  console.log(`[DATABASE] Attempting to connect to PostgreSQL:
  - Database: ${process.env.PG_DATABASE}
  - User: ${process.env.PG_USER}
  - Host: ${process.env.PG_HOST}
  - Port: ${process.env.PG_PORT || 5432}
`);

  sequelize = new Sequelize(
    process.env.PG_DATABASE,
    process.env.PG_USER,
    process.env.PG_PASSWORD,
    {
      host: process.env.PG_HOST,
      dialect: 'postgres',
      port: process.env.PG_PORT || 5432,
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      // Set timeout to 10 seconds for faster fallback
      dialectOptions: {
        connectTimeout: 10000
      }
    }
  );
} else {
  console.log('[DATABASE] PostgreSQL configuration not found. Using SQLite fallback from the start.');
  isFallbackMode = true;
  
  // Initialize SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './carshop.sqlite',
    logging: false
  });
}

const connectDB = async () => {
  // If we're already in fallback mode, just connect to SQLite
  if (isFallbackMode) {
    try {
      await sequelize.authenticate();
      console.log('[DATABASE] Connected to SQLite successfully in fallback mode');
      return;
    } catch (err) {
      console.error('[DATABASE] Error connecting to SQLite fallback:', err);
      throw err;
    }
  }
  
  // Try PostgreSQL first
  try {
    await sequelize.authenticate();
    console.log('[DATABASE] PostgreSQL Connected successfully');
  } catch (err) {
    console.error('[DATABASE] PostgreSQL connection error:', err.message);
    console.log('[DATABASE] Falling back to SQLite database...');
    
    // Switch to SQLite
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: './carshop.sqlite',
      logging: false
    });
    
    try {
      await sequelize.authenticate();
      isFallbackMode = true;
      console.log('[DATABASE] Connected to SQLite successfully in fallback mode');
    } catch (sqliteErr) {
      console.error('[DATABASE] Error connecting to SQLite fallback:', sqliteErr);
      throw sqliteErr;
    }
  }
};

module.exports = { sequelize, connectDB, isFallbackMode };
