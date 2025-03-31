// filepath: CarShopBackend/controllers/carController.js
const { faker } = require('@faker-js/faker'); // Import faker
const fs = require('fs');
const path = require('path');

// Simulate a database with some initial car data
const carsData = {
  cars: [
    {
      id: 1,
      make: 'Toyota',
      model: 'Corolla',
      year: '2022',
      fuelType: 'Gasoline',
      price: 25000,
      description: 'Reliable and fuel-efficient sedan',
      img: 'corolla.jpg'
    },
    {
      id: 2,
      make: 'Honda',
      model: 'Civic',
      year: '2023',
      fuelType: 'Hybrid',
      price: 28000,
      description: 'Modern design with excellent fuel economy',
      img: 'civic.jpg'
    },
    {
      id: 3,
      make: 'Toyota',
      model: 'Camry',
      year: '2022',
      fuelType: 'Gasoline',
      price: 30000,
      description: 'Comfortable mid-size sedan',
      img: 'camry.jpg'
    }
    // More cars can be added here
  ],
  nextId: 4
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
  
  // Apply filters
  let filteredCars = filterCars({
    cars: carsData.cars,
    make: req.query.make,
    model: req.query.model,
    minYear: req.query.minYear,
    maxYear: req.query.maxYear,
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    fuelType: req.query.fuelType
  });
  
  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const totalPages = Math.ceil(filteredCars.length / limit);
  
  // Get the requested page of cars
  const paginatedCars = filteredCars.slice(startIndex, endIndex);
  
  res.json({
    cars: paginatedCars,
    currentPage: page,
    totalPages,
    totalCars: filteredCars.length
  });
};

// Filter cars based on query parameters
const filterCars = ({ cars, make, model, minYear, maxYear, minPrice, maxPrice, fuelType }) => {
  return cars.filter(car => {
    // Filter by make
    if (make && car.make.toLowerCase() !== make.toLowerCase()) {
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
    
    // Filter by fuel type
    if (fuelType && car.fuelType !== fuelType) {
      return false;
    }
    
    return true;
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
  
  // Remove car from "database"
  carsData.cars.splice(carIndex, 1);
  
  res.json({ message: 'Car deleted successfully' });
};

module.exports = {
  getCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  filterCars,
  validateCarData,
  carsData // Exporting this for testing purposes
};