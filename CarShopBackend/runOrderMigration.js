const { Sequelize } = require('sequelize');
const migration = require('./migrations/20250613000000-create-order-tables.js');

require('dotenv').config();

async function runOrderMigration() {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: console.log
  });

  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    const queryInterface = sequelize.getQueryInterface();
    
    console.log('Running order tables migration...');
    await migration.up(queryInterface, Sequelize);
    console.log('Order tables migration completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    if (error.original && error.original.code === '42P07') {
      console.log('Tables may already exist, continuing...');
    } else {
      throw error;
    }
  } finally {
    await sequelize.close();
  }
}

runOrderMigration();
