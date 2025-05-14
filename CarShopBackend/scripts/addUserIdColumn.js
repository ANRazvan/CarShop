// Add userId column to Cars table
const { sequelize } = require('../config/pgdb');

async function addUserIdColumn() {
  try {
    console.log('Adding userId column to Cars table...');
    
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Cars' 
      AND column_name = 'userId';
    `;
    
    const [checkResults] = await sequelize.query(checkColumnQuery);
    
    if (checkResults.length === 0) {
      // Column doesn't exist, add it
      const addColumnQuery = `
        ALTER TABLE "Cars" 
        ADD COLUMN "userId" INTEGER 
        REFERENCES "Users"(id) ON DELETE SET NULL;
      `;
      
      await sequelize.query(addColumnQuery);
      console.log('userId column added successfully.');
    } else {
      console.log('userId column already exists.');
    }
    
  } catch (error) {
    console.error('Error adding userId column:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the function
addUserIdColumn();
