const { Sequelize } = require('sequelize');
const migration = require('./migrations/20250526000000-add-2fa-fields.js');

require('dotenv').config();

async function runMigration() {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });

  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    const queryInterface = sequelize.getQueryInterface();
    
    await migration.up(queryInterface, Sequelize);
    console.log('Migration completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration();
