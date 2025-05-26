require('dotenv').config();
const sequelize = require('./config/database');

async function alter2FAFields() {
  try {
    await sequelize.authenticate();
    console.log('Connected to the database.');

    await sequelize.query(`
      ALTER TABLE "Users" 
      ADD COLUMN IF NOT EXISTS "twoFactorSecret" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS "backupCodes" JSON;
    `);

    console.log('Successfully added 2FA fields to Users table');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

alter2FAFields();
