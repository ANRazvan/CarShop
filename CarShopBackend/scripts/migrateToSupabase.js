// This script will migrate data to Supabase
require('dotenv').config();
const { sequelize: sourceDB } = require('../config/pgdb');
const { sequelize: targetDB } = require('../config/supabase-db');
const { faker } = require('@faker-js/faker');
const Car = require('../models/Car');
const Brand = require('../models/Brand');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const BATCH_SIZE = 1000;
const TOTAL_BRANDS = 50;
const TOTAL_CARS = 100000;

async function migrateData() {
    console.log('Starting data migration to Supabase...');

    try {
        // Test Supabase connection
        await targetDB.authenticate();
        console.log('Connected to Supabase successfully.');

        // Sync the models with Supabase
        await targetDB.sync();

        // First, migrate or create brands
        const existingBrands = await Brand.findAll();
        if (existingBrands.length > 0) {
            console.log(`Migrating ${existingBrands.length} existing brands...`);
            await targetDB.model('Brand').bulkCreate(
                existingBrands.map(brand => brand.toJSON())
            );
        } else {
            console.log('No existing brands found. Generating new brands...');
            const brands = [];
            for (let i = 0; i < TOTAL_BRANDS; i++) {
                brands.push({
                    name: faker.company.name(),
                    country: faker.location.country(),
                    foundedYear: faker.date.past({years: 100}).getFullYear(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
            await targetDB.model('Brand').bulkCreate(brands);
        }

        // Create default admin user if it doesn't exist
        const adminPassword = 'admin123'; // You should change this
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);
        
        await targetDB.model('User').findOrCreate({
            where: { username: 'admin' },
            defaults: {
                email: 'admin@carshop.com',
                password: hashedPassword,
                role: 'admin',
                active: true
            }
        });

        // Now migrate or generate cars
        const existingCars = await Car.findAll();
        if (existingCars.length > 0) {
            console.log(`Migrating ${existingCars.length} existing cars...`);
            // Migrate in batches to avoid memory issues
            for (let i = 0; i < existingCars.length; i += BATCH_SIZE) {
                const batch = existingCars.slice(i, i + BATCH_SIZE);
                await targetDB.model('Car').bulkCreate(
                    batch.map(car => car.toJSON())
                );
                console.log(`Migrated cars ${i + 1} to ${i + batch.length}`);
            }
        } else {
            console.log('No existing cars found. Generating new cars...');
            const brands = await targetDB.model('Brand').findAll();
            const fuelTypes = ['Diesel', 'Gasoline', 'Hybrid', 'Electric', 'Plug-in Hybrid'];
            
            // Generate cars in batches
            for (let i = 0; i < TOTAL_CARS; i += BATCH_SIZE) {
                const cars = [];
                const batchSize = Math.min(BATCH_SIZE, TOTAL_CARS - i);
                
                for (let j = 0; j < batchSize; j++) {
                    const brand = faker.helpers.arrayElement(brands);
                    const year = faker.number.int({ min: 2000, max: 2025 });
                    const fuelType = faker.helpers.arrayElement(fuelTypes);
                    const price = faker.number.float({ min: 5000, max: 150000, precision: 0.01 });
                    const model = faker.vehicle.model();
                    
                    cars.push({
                        brandId: brand.id,
                        make: brand.name,
                        model,
                        year,
                        fuelType,
                        price,
                        keywords: `${brand.name} ${model} ${year} ${fuelType}`,
                        description: faker.lorem.paragraph(),
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
                
                await targetDB.model('Car').bulkCreate(cars);
                console.log(`Generated cars ${i + 1} to ${i + cars.length}`);
            }
        }

        console.log('Data migration completed successfully!');
        
    } catch (error) {
        console.error('Error during migration:', error);
        throw error;
    }
}

// Run the migration
migrateData()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
