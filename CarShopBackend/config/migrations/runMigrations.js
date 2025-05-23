const sequelize = require('../database');
const { DataTypes } = require('sequelize');

async function runMigrations() {
    const queryInterface = sequelize.getQueryInterface();
    
    try {
        // Add userId column to Cars table
        await queryInterface.addColumn('Cars', 'userId', {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });
        
        console.log('Migration completed successfully');
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError' || 
            (error.original && error.original.code === '42701')) {
            console.log('Column already exists, skipping...');
        } else {
            console.error('Migration failed:', error);
            process.exit(1);
        }
    } finally {
        await sequelize.close();
    }
}

// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations();
}

module.exports = runMigrations;
