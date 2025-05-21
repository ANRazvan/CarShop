const sequelize = require('../supabase-db');
const addUserIdToCarsMigration = require('./add-userId-to-cars');

async function runMigrations() {
    try {
        // Run the migration
        await sequelize.query(addUserIdToCarsMigration);
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations();
}

module.exports = runMigrations;
