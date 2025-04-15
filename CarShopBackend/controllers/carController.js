// filepath: CarShopBackend/controllers/carController.js
const { faker } = require('@faker-js/faker'); // Import faker
const fs = require('fs');
const path = require('path');
const carsData = require('../data/cars'); // Import the cars data

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

// Generate cars and add them to the data store
const populateCars = (count) => {
  const generatedCars = generateCars(count);
  carsData.cars = [...carsData.cars, ...generatedCars];
  return generatedCars;
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
const getCars = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  // Extract filter parameters including arrays for make and fuelType
  const make = req.query.make ? req.query.make.split(',') : null;
  const fuelType = req.query.fuelType ? req.query.fuelType.split(',') : null;
  const search = req.query.search || '';
  
  // Apply filters
  let filteredCars = filterCars({
    cars: carsData.cars,
    make: make,
    model: req.query.model,
    minYear: req.query.minYear,
    maxYear: req.query.maxYear,
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    fuelType: fuelType,
    search: search
  });
  
  // Sort if requested
  if (req.query.sortBy) {
    const sortBy = req.query.sortBy;
    const sortOrder = req.query.sortOrder || 'asc';
    
    filteredCars = sortCars(filteredCars, sortBy, sortOrder);
  }
  
  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const totalPages = Math.ceil(filteredCars.length / limit);
  
  // Get the requested page of cars
  const paginatedCars = filteredCars.slice(startIndex, endIndex);
  
  // Get unique makes for filtering options
  const makes = [...new Set(carsData.cars.map(car => car.make))];
  
  res.json({
    cars: paginatedCars,
    currentPage: page,
    totalPages,
    totalCars: filteredCars.length,
    makes: makes // Return available makes for the frontend
  });
};

// Filter cars based on query parameters
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

// Add a sorting function
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

// Get car by ID
const getCarById = (req, res) => {
  const carId = parseInt(req.params.id);
  const car = carsData.cars.find(c => c.id === carId);
  
  if (!car) {
    return res.status(404).json({ error: 'Car not found' });
  }
  
  res.json(car);
};

// Create new car
const createCar = (req, res) => {
  const carData = {
    ...req.body,
    img: req.file ? req.file.filename : 'default-car.jpg'
  };
  
  // Validate car data
  const validation = validateCarData(carData);
  if (!validation.valid) {
    return res.status(400).json({ errors: validation.errors });
  }
  
  // Create new car with unique ID
  const newCar = {
    id: carsData.nextId++,
    ...carData
  };
  
  // Add to "database"
  carsData.cars.push(newCar);
  
  // Broadcast event is now handled in the middleware layer in server.js
  // This keeps the controller focused on data operations
  
  res.status(201).json(newCar);
};

// Update car
const updateCar = (req, res) => {
  const carId = parseInt(req.params.id);
  const carIndex = carsData.cars.findIndex(c => c.id === carId);
  
  if (carIndex === -1) {
    return res.status(404).json({ error: 'Car not found' });
  }
  
  try {
    // Update car data
    const updatedCar = {
      ...carsData.cars[carIndex],
      ...req.body
    };
    
    // If there's a new image, update the img property
    if (req.file) {
      updatedCar.img = req.file.filename;
    }
    
    // Convert price to number if it's a string
    if (updatedCar.price && typeof updatedCar.price === 'string') {
      updatedCar.price = parseInt(updatedCar.price);
    }
    
    // Validate the updated car
    const validation = validateCarData(updatedCar);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    // Save updated car
    carsData.cars[carIndex] = updatedCar;
    
    // Broadcast event is now handled in the middleware layer in server.js
    
    res.json(updatedCar);
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete car
const deleteCar = (req, res) => {
  const carId = parseInt(req.params.id);
  const carIndex = carsData.cars.findIndex(c => c.id === carId);
  
  if (carIndex === -1) {
    return res.status(404).json({ error: 'Car not found' });
  }
  
  // Get a reference to the car before deletion (for WebSocket event)
  const deletedCar = carsData.cars[carIndex];
  
  // Remove car from "database"
  carsData.cars.splice(carIndex, 1);
  
  // Broadcast event is now handled in the middleware layer in server.js
  
  res.json({ 
    message: 'Car deleted successfully',
    id: carId
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