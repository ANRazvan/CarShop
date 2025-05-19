// Script to check existing database indices for presentation
const { sequelize } = require('../config/pgdb');

async function checkIndices() {
  try {
    // Show created indices
    const [indices] = await sequelize.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);
    
    console.log('\nDatabase Indices:');
    console.log('=====================================');
    
    const tableIndices = {};
    
    // Group indices by table
    indices.forEach(idx => {
      if (!tableIndices[idx.tablename]) {
        tableIndices[idx.tablename] = [];
      }
      tableIndices[idx.tablename].push({
        name: idx.indexname,
        definition: idx.indexdef
      });
    });
    
    // Print indices by table
    Object.keys(tableIndices).sort().forEach(tableName => {
      console.log(`\nTable: ${tableName}`);
      console.log('---------------------------------');
      tableIndices[tableName].forEach(idx => {
        console.log(`- ${idx.name}:`);
        console.log(`  ${idx.definition}`);
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking indices:', error);
    process.exit(1);
  }
}

// Run the function
checkIndices();
