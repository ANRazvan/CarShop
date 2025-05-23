const { Sequelize } = require('sequelize');
require('dotenv').config();

// Log DB connection parameters for debugging (hiding password)
console.log(`[DATABASE] Connecting to PostgreSQL:
  - Database: ${process.env.PG_DATABASE || 'postgres'}
  - User: ${process.env.PG_USER || 'postgres'}
  - Host: ${process.env.PG_HOST || 'db.rjlewidauwbneruxdspn.supabase.co'}
  - Port: ${process.env.PG_PORT || 5432}
`);

const sequelize = new Sequelize(
  process.env.PG_DATABASE || 'postgres',
  process.env.PG_USER || 'postgres',
  process.env.PG_PASSWORD,
  {
    host: process.env.PG_HOST || 'db.rjlewidauwbneruxdspn.supabase.co',
    dialect: 'postgres',
    port: process.env.PG_PORT || 5432,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      connectTimeout: 30000
    },
    retry: {
      max: 5, // Maximum number of connection retries
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /TimeoutError/,
      ]
    }
  }
);

const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      await sequelize.authenticate();
      console.log('PostgreSQL Connected successfully');
      return;
    } catch (error) {
      console.error(`[DATABASE ERROR] ${error.message}`);
      console.error(`[DATABASE] Connection attempt failed. Retries left: ${retries-1}`);
      
      if (retries <= 1) {
        console.error('[DATABASE] All connection attempts failed. Starting in limited mode without database.');
        // Don't exit - allow app to run with limited functionality
        return;
      }
      
      retries -= 1;
      // Wait for 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

module.exports = { connectDB, sequelize };