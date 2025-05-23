// Database population script using Faker to generate 100,000+ entries
const { faker } = require('@faker-js/faker');
const { sequelize } = require('../config/database');
const Car = require('../models/Car');
const Brand = require('../models/Brand');
const fs = require('fs');
const path = require('path');

// Configure batch size for efficient inserts
const BATCH_SIZE = 1000;
const TOTAL_CARS = 100000;
const TOTAL_BRANDS = 50;

async function populateBrands() {
  console.log('Creating brands...');
  
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
  
  await Brand.bulkCreate(brands);
  console.log(`Created ${brands.length} brands`);
  
  return await Brand.findAll({ attributes: ['id', 'name'] });
}

async function generateCars(batchSize, brands) {
  const cars = [];
  const fuelTypes = ['Diesel', 'Gasoline', 'Hybrid', 'Electric', 'Plug-in Hybrid'];
  
  for (let i = 0; i < batchSize; i++) {
    const brand = faker.helpers.arrayElement(brands);
    const year = faker.number.int({ min: 2000, max: 2025 });
    const fuelType = faker.helpers.arrayElement(fuelTypes);
    const price = faker.number.float({ min: 5000, max: 150000, precision: 0.01 });
    const model = faker.vehicle.model();
    
    // Generate keywords for better searchability
    const keywords = `${brand.name} ${model} ${year} ${fuelType} ${faker.vehicle.type()}`;
    
    cars.push({
      brandId: brand.id,
      make: brand.name,
      model,
      year,
      keywords,
      description: faker.lorem.paragraphs(2),
      fuelType,
      price,
      img: `data:image/jpeg;base64,${faker.string.alphanumeric(200)}`, // Mock Base64 image
      imgType: 'image/jpeg',
      createdAt: faker.date.between({ from: '2023-01-01', to: new Date() }),
      updatedAt: new Date()
    });
  }
  
  return cars;
}

async function populateDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');
    
    console.time('Total population time');
    
    // Create brands first
    const brands = await populateBrands();
    
    if (brands.length === 0) {
      throw new Error('Failed to create brands');
    }
    
    console.log(`Starting car generation: ${TOTAL_CARS} cars in batches of ${BATCH_SIZE}`);
    
    let totalInserted = 0;
    
    // Process in batches for memory efficiency
    for (let i = 0; i < TOTAL_CARS; i += BATCH_SIZE) {
      const batchSize = Math.min(BATCH_SIZE, TOTAL_CARS - i);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(TOTAL_CARS / BATCH_SIZE);
      
      console.log(`Generating batch ${batchNumber}/${totalBatches} (${totalInserted} - ${totalInserted + batchSize})`);
      console.time(`Batch ${batchNumber}`);
      
      const cars = await generateCars(batchSize, brands);
      await Car.bulkCreate(cars);
      
      totalInserted += batchSize;
      console.timeEnd(`Batch ${batchNumber}`);
      console.log(`Progress: ${totalInserted}/${TOTAL_CARS} (${((totalInserted/TOTAL_CARS)*100).toFixed(2)}%)`);
    }
    
    console.timeEnd('Total population time');
    console.log('Database population complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error populating database:', error);
    process.exit(1);
  }
}

// Check if this script is being run directly
if (require.main === module) {
  // Install required package if not already installed
  try {
    require('@faker-js/faker');
  } catch (e) {
    console.log('Installing required dependencies...');
    require('child_process').execSync('npm install @faker-js/faker --save-dev', { stdio: 'inherit' });
  }
  
  populateDatabase();
}

module.exports = { populateDatabase, generateCars };