const { faker } = require('@faker-js/faker'); 
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const Car = require('../models/Car');
const { sequelize } = require('../config/pgdb'); // Import the sequelize instance
const carsData = require('../data/cars'); // Keep for reference data

// Car makes and models mapping
const carModels = {
  'Mazda': ['3', '6', 'CX-5', 'MX-5', 'CX-30'],
  'Toyota': ['Camry', 'Corolla', 'RAV4', 'Prius', 'Highlander'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V'],
  'Ford': ['Mondeo', 'Focus', 'Mustang', 'Explorer', 'F-150'],
  'BMW': ['3 Series', '5 Series', 'X3', 'X5', '7 Series'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'A-Class', 'GLC', 'S-Class'],
  'Audi': ['A4', 'A6', 'Q5', 'Q7', 'A3'],
  'Volkswagen': ['Passat', 'Golf', 'Tiguan', 'Polo', 'Jetta'],
  'Hyundai': ['Sonata', 'Elantra', 'Tucson', 'Santa Fe', 'Kona'],
  'Kia': ['Optima', 'Forte', 'Sorento', 'Sportage', 'Soul'],
  'Nissan': ['Altima', 'Maxima', 'Rogue', 'Sentra', 'Pathfinder']
};

// Fuel types
const fuelTypes = ['Diesel', 'Gasoline', 'Hybrid', 'Electric'];

// Available images
const availableImages = [
  'mazda1.jpeg', 'mazda2.jpeg', 'audia4.jpeg', 'bmw3series.jpeg', 
  'camry.jpg', 'cclass.jpeg', 'civic.jpeg', 'mondeo.jpeg', 
  'optima.jpeg', 'sonata.jpeg', 'altima.jpeg'
];

// Generate a random car
const generateCar = () => {
  // Pick a random make
  const make = faker.helpers.arrayElement(Object.keys(carModels));
  
  // Pick a model for the make
  const model = faker.helpers.arrayElement(carModels[make]);
  
  // Generate a year between 2018 and 2023
  const year = faker.number.int({ min: 2018, max: 2023 }).toString();
  
  // Pick a fuel type
  const fuelType = faker.helpers.arrayElement(fuelTypes);
  
  // Generate a price between 15000 and 50000
  const price = faker.number.int({ min: 15000, max: 50000 });
  
  // Generate keywords
  const engineSize = (fuelType === 'Electric') 
    ? `${faker.number.int({ min: 30, max: 120 })}kWh Battery` 
    : `${faker.number.float({ min: 1.0, max: 3.0, precision: 0.1 })}L ${fuelType}`;
  const keywords = `${engineSize} ${faker.number.int({ min: 100, max: 350 })}Hp ${year}`;
  
  // Generate description
  const description = `The ${make} ${model} is a ${faker.helpers.arrayElement(['stylish', 'modern', 'practical', 'reliable', 'comfortable'])} 
    ${faker.helpers.arrayElement(['sedan', 'car', 'vehicle'])} with a ${engineSize} engine, 
    ${faker.helpers.arrayElement(['offering exceptional performance', 'providing great fuel efficiency', 'combining power and efficiency'])}.
    It features ${faker.helpers.arrayElement(['premium interior', 'advanced technology', 'spacious cabin', 'modern design'])} and 
    ${faker.helpers.arrayElement(['excellent safety features', 'intuitive controls', 'state-of-the-art infotainment', 'advanced driver assistance'])}.`;
  
  // Pick a random image from available images
  const img = faker.helpers.arrayElement(availableImages);
  
  // Create the car object
  return {
    id: carsData.nextId++,
    make,
    model,
    year,
    keywords,
    description,
    fuelType,
    price,
    img
  };
};

// Generate multiple cars
const generateCars = (count) => {
  const newCars = [];
  for (let i = 0; i < count; i++) {
    newCars.push(generateCar());
  }
  return newCars;
};

// Populate database with generated cars
const populateCars = async (count) => {
  const generatedCars = generateCars(count);
  // Create cars in database using Sequelize
  const createdCars = await Car.bulkCreate(generatedCars);
  return createdCars;
};

// Validate car data
const validateCarData = (car) => {
  const errors = [];
  
  // Check required fields
  if (!car.make || car.make.trim() === '') {
    errors.push('Make is required');
  }
  
  if (!car.model || car.model.trim() === '') {
    errors.push('Model is required');
  }
  
  if (!car.year || car.year.toString().trim() === '') {
    errors.push('Year is required');
  }
  
  if (car.price === undefined || car.price === null || 
      (typeof car.price === 'string' && car.price.trim() === '')) {
    errors.push('Price is required');
  }
  
  // Additional validations could be added here
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Get paginated cars with optional filters
const getCars = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    // Check for itemsPerPage parameter first, then fall back to limit
    let limit = parseInt(req.query.itemsPerPage) || parseInt(req.query.limit) || 10;
    
    // Handle the special case for unlimited items
    const isUnlimited = limit === -1;
    const useLimit = isUnlimited ? null : limit;
    
    // For unlimited query, we don't want any offset
    const offset = isUnlimited ? 0 : (page - 1) * limit;
    
    // Extract filter parameters
    const make = req.query.make ? req.query.make.split(',') : null;
    const fuelType = req.query.fuelType ? req.query.fuelType.split(',') : null;
    const search = req.query.search || '';
    
    // Build the query conditions
    const whereConditions = {};
    
    // Filter by make
    if (make && make.length > 0) {
      whereConditions.make = { [Op.in]: make };
    }
    
    // Filter by model
    if (req.query.model) {
      whereConditions.model = { [Op.iLike]: `%${req.query.model}%` };
    }
    
    // Filter by year range
    if (req.query.minYear || req.query.maxYear) {
      whereConditions.year = {};
      if (req.query.minYear) {
        whereConditions.year[Op.gte] = parseInt(req.query.minYear);
      }
      if (req.query.maxYear) {
        whereConditions.year[Op.lte] = parseInt(req.query.maxYear);
      }
    }
    
    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      whereConditions.price = {};
      if (req.query.minPrice) {
        whereConditions.price[Op.gte] = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        whereConditions.price[Op.lte] = parseFloat(req.query.maxPrice);
      }
    }
    
    // Filter by fuel type
    if (fuelType && fuelType.length > 0) {
      whereConditions.fuelType = { [Op.in]: fuelType };
    }
    
    // Filter by search term
    if (search && search.trim() !== '') {
      whereConditions[Op.or] = [
        { make: { [Op.iLike]: `%${search}%` } },
        { model: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { keywords: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Set up sorting
    let order = [];
    if (req.query.sortBy) {
      const sortBy = req.query.sortBy;
      const sortOrder = req.query.sortOrder || 'ASC';
      order.push([sortBy, sortOrder.toUpperCase()]);
    } else {
      order.push(['id', 'ASC']);
    }
    
    // Create the query options object
    const queryOptions = {
      where: whereConditions,
      order,
      offset
    };
    
    // Only add the limit if it's not for unlimited items
    if (useLimit !== null) {
      queryOptions.limit = useLimit;
    }
    
    // Log the query we're about to execute
    console.log('Executing car query with options:', JSON.stringify({
      page,
      limit: useLimit,
      offset,
      isUnlimited,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    }));
    
    // For debugging - check if car 14 exists at all
    try {
      const specialCar = await Car.findByPk(14);
      console.log("DEBUGGING - Does car 14 exist?", specialCar ? "YES" : "NO");
      if (specialCar) {
        console.log("DEBUGGING - Car 14 details:", JSON.stringify(specialCar.toJSON()));
      }
    } catch (err) {
      console.error("Error checking car 14:", err);
    }
    
    // Query the database with all filters applied
    const { count, rows } = await Car.findAndCountAll(queryOptions);
    
    // Log detailed information about the results
    console.log(`Found ${rows.length} cars out of ${count} total matches`);
    if (rows.length > 0) {
      console.log(`First car ID: ${rows[0].id}, Last car ID: ${rows[rows.length-1].id}`);
      console.log(`Car IDs in results: ${rows.map(car => car.id).join(', ')}`);
    }
    
    // Check specifically for ID 14
    const hasID14 = rows.some(car => car.id === 14);
    console.log(`Does result set include car with ID 14? ${hasID14}`);
    
    // Get unique makes for filtering options (using Sequelize distinct query)
    const makes = await Car.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('make')), 'make']],
      raw: true
    });
    
    const totalPages = isUnlimited ? 1 : Math.ceil(count / limit);
    
    res.json({
      cars: rows,
      currentPage: page,
      totalPages,
      totalCars: count,
      makes: makes.map(m => m.make),
      unlimited: isUnlimited
    });
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get car by ID
const getCarById = async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    const car = await Car.findByPk(carId);
    
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    res.json(car);
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new car
const createCar = async (req, res) => {
  try {
    const carData = {
      ...req.body,
      img: req.file ? req.file.filename : 'default-car.jpg'
    };
    
    // Validate car data
    const validation = validateCarData(carData);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    // Create car in database
    const newCar = await Car.create(carData);
    
    res.status(201).json(newCar);
  } catch (error) {
    console.error('Error creating car:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update car
const updateCar = async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    const car = await Car.findByPk(carId);
    
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    // Update car data
    const updatedData = {
      ...req.body
    };
    
    // If there's a new image, update the img property
    if (req.file) {
      updatedData.img = req.file.filename;
    }
    
    // Convert price to number if it's a string
    if (updatedData.price && typeof updatedData.price === 'string') {
      updatedData.price = parseFloat(updatedData.price);
    }
    
    // Validate the updated car
    const validation = validateCarData({...car.toJSON(), ...updatedData});
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    // Update in database
    await car.update(updatedData);
    
    // Get the updated car
    const updatedCar = await Car.findByPk(carId);
    
    res.json(updatedCar);
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete car
const deleteCar = async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    const car = await Car.findByPk(carId);
    
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    // Delete from database
    await car.destroy();
    
    res.json({ 
      message: 'Car deleted successfully',
      id: carId
    });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// These utility functions can be kept as they help with testing
const filterCars = ({ cars, make, model, minYear, maxYear, minPrice, maxPrice, fuelType, search }) => {
  return cars.filter(car => {
    // Filter by make (now supports array of makes)
    if (make && make.length > 0 && !make.some(m => car.make.toLowerCase() === m.toLowerCase())) {
      return false;
    }
    
    // Filter by model
    if (model && car.model.toLowerCase() !== model.toLowerCase()) {
      return false;
    }
    
    // Filter by year range
    if (minYear && parseInt(car.year) < parseInt(minYear)) {
      return false;
    }
    if (maxYear && parseInt(car.year) > parseInt(maxYear)) {
      return false;
    }
    
    // Filter by price range
    if (minPrice && car.price < parseInt(minPrice)) {
      return false;
    }
    if (maxPrice && car.price > parseInt(maxPrice)) {
      return false;
    }
    
    // Filter by fuel type (now supports array of fuel types)
    if (fuelType && fuelType.length > 0 && !fuelType.some(f => car.fuelType === f)) {
      return false;
    }
    
    // Filter by search term (check in make, model, description, keywords)
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      const makeMatch = car.make.toLowerCase().includes(searchLower);
      const modelMatch = car.model.toLowerCase().includes(searchLower);
      const descMatch = car.description.toLowerCase().includes(searchLower);
      const keywordsMatch = car.keywords && car.keywords.toLowerCase().includes(searchLower);
      
      if (!makeMatch && !modelMatch && !descMatch && !keywordsMatch) {
        return false;
      }
    }
    
    return true;
  });
};

const sortCars = (cars, sortBy, sortOrder) => {
  return [...cars].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'year':
        comparison = parseInt(a.year) - parseInt(b.year);
        break;
      // Add more sorting options as needed
      default:
        comparison = 0;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
};

module.exports = {
  getCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  filterCars,
  sortCars,
  validateCarData,
  carsData, // Exporting this for testing purposes
  generateCar,
  generateCars,
  populateCars
};