// Database optimization script to create indices for performance
const { sequelize } = require('../config/pgdb');

async function createIndices() {
  try {
    console.log('Creating database indices for performance optimization...');
    
    // Array of operations to execute in sequence
    const operations = [
      // Indices for Cars table
      'CREATE INDEX IF NOT EXISTS idx_cars_brand_id ON "Cars" ("brandId")',
      'CREATE INDEX IF NOT EXISTS idx_cars_fuel_type ON "Cars" ("fuelType")',
      'CREATE INDEX IF NOT EXISTS idx_cars_year ON "Cars" ("year")',
      'CREATE INDEX IF NOT EXISTS idx_cars_price ON "Cars" ("price")',
      'CREATE INDEX IF NOT EXISTS idx_cars_make ON "Cars" ("make")',
      'CREATE INDEX IF NOT EXISTS idx_cars_keywords ON "Cars" USING gin (to_tsvector(\'english\', "keywords"))',
      
      // Composite indices for common filtering patterns
      'CREATE INDEX IF NOT EXISTS idx_cars_brand_fuel_price ON "Cars" ("brandId", "fuelType", "price")',
      'CREATE INDEX IF NOT EXISTS idx_cars_make_model ON "Cars" ("make", "model")',
      'CREATE INDEX IF NOT EXISTS idx_cars_year_price ON "Cars" ("year", "price")',
      
      // Indices for Brands table
      'CREATE INDEX IF NOT EXISTS idx_brands_name ON "Brands" ("name")',
      'CREATE INDEX IF NOT EXISTS idx_brands_country ON "Brands" ("country")',
    ];
    
    // Execute each operation
    for (const operation of operations) {
      console.log(`Executing: ${operation}`);
      await sequelize.query(operation);
    }
    
    console.log('Database indices created successfully!');
    
    // Show created indices
    const [indices] = await sequelize.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);
    
    console.log('\nCreated Indices:');
    indices.forEach(idx => {
      console.log(`- ${idx.indexname} on ${idx.tablename}: ${idx.indexdef}`);
    });
    
    console.log('\nOptimization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating indices:', error);
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  createIndices();
}

module.exports = { createIndices };