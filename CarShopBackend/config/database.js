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
      max: 5,
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

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err.message);
    if (err.original) {
      console.error('Original error:', {
        code: err.original.code,
        errno: err.original.errno,
        syscall: err.original.syscall,
        hostname: err.original.hostname
      });
    }
  });

module.exports = sequelize;