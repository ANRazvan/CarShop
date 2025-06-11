const { faker } = require('@faker-js/faker'); 
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const Car = require('../models/Car');
const Brand = require('../models/Brand');
const User = require('../models/User');
const  sequelize  = require('../config/database');
const carsData = require('../data/cars'); // Keep for reference data

// Fuel types
const fuelTypes = ['Diesel', 'Gasoline', 'Hybrid', 'Electric'];

// Available images
const availableImages = [
  'mazda1.jpeg', 'mazda2.jpeg', 'audia4.jpeg', 'bmw3series.jpeg', 
  'camry.jpg', 'cclass.jpeg', 'civic.jpeg', 'mondeo.jpeg', 
  'optima.jpeg', 'sonata.jpeg', 'altima.jpeg'
];

// Model mappings - key is brandId, value is array of model names
const brandModels = {
  // These will be populated dynamically from the database
};

// Generate a random car
const generateCar = async () => {
  try {
    // Fetch all brands from database
    const brands = await Brand.findAll();
    
    if (brands.length === 0) {
      throw new Error('No brands found in database. Please seed brands first.');
    }
    
    // Pick a random brand
    const brand = faker.helpers.arrayElement(brands);
    
    // Define models for each brand if not already defined
    if (!brandModels[brand.id]) {
      // For each brand, define 5 possible models
      switch(brand.name) {
        case 'Mazda':
          brandModels[brand.id] = ['3', '6', 'CX-5', 'MX-5', 'CX-30'];
          break;
        case 'Toyota':
          brandModels[brand.id] = ['Camry', 'Corolla', 'RAV4', 'Prius', 'Highlander'];
          break;
        case 'Honda':
          brandModels[brand.id] = ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V'];
          break;
        case 'Ford':
          brandModels[brand.id] = ['Mondeo', 'Focus', 'Mustang', 'Explorer', 'F-150'];
          break;
        case 'BMW':
          brandModels[brand.id] = ['3 Series', '5 Series', 'X3', 'X5', '7 Series'];
          break;
        case 'Mercedes-Benz':
          brandModels[brand.id] = ['C-Class', 'E-Class', 'A-Class', 'GLC', 'S-Class'];
          break;
        case 'Audi':
          brandModels[brand.id] = ['A4', 'A6', 'Q5', 'Q7', 'A3'];
          break;
        case 'Volkswagen':
          brandModels[brand.id] = ['Passat', 'Golf', 'Tiguan', 'Polo', 'Jetta'];
          break;
        case 'Hyundai':
          brandModels[brand.id] = ['Sonata', 'Elantra', 'Tucson', 'Santa Fe', 'Kona'];
          break;
        case 'Kia':
          brandModels[brand.id] = ['Optima', 'Forte', 'Sorento', 'Sportage', 'Soul'];
          break;
        case 'Nissan':
          brandModels[brand.id] = ['Altima', 'Maxima', 'Rogue', 'Sentra', 'Pathfinder'];
          break;
        default:
          // For any other brand, generate generic models
          brandModels[brand.id] = [
            'Sedan', 'SUV', 'Coupe', 'Hatchback', 'Convertible'
          ];
      }
    }
    
    // Pick a model for this brand
    const model = faker.helpers.arrayElement(brandModels[brand.id]);
    
    // Generate a truly random year between 2018 and 2023
    const year = faker.number.int({ min: 2018, max: 2023 });
    
    // Pick a fuel type
    const fuelType = faker.helpers.arrayElement(fuelTypes);
    
    // Generate a more precise price between 15000 and 50000
    // Using decimal to ensure more variation
    const price = faker.number.float({ min: 15000, max: 50000, precision: 0.01 });
    
    // Generate keywords with more variety
    const engineSize = (fuelType === 'Electric') 
      ? `${faker.number.int({ min: 30, max: 120 })}kWh Battery` 
      : `${faker.number.float({ min: 1.0, max: 3.0, precision: 0.1 })}L ${fuelType}`;
    const performance = faker.number.int({ min: 100, max: 350 });
    const keywords = `${engineSize} ${performance}Hp ${year} ${faker.vehicle.vin().substring(0, 4)}`; // Add unique identifier
    
    // Generate description with random elements to ensure uniqueness
    const carAdjective = faker.helpers.arrayElement(['stylish', 'modern', 'practical', 'reliable', 'comfortable', 'sporty', 'elegant', 'luxurious']);
    const carType = faker.helpers.arrayElement(['sedan', 'car', 'vehicle', 'automobile', 'transportation option']);
    const performanceDescription = faker.helpers.arrayElement([
      'offering exceptional performance', 
      'providing great fuel efficiency', 
      'combining power and efficiency',
      'delivering impressive handling',
      'featuring outstanding acceleration'
    ]);
    const featureType = faker.helpers.arrayElement([
      'premium interior', 
      'advanced technology', 
      'spacious cabin', 
      'modern design',
      'ergonomic controls',
      'high-quality materials',
      'stylish appearance'
    ]);
    const safetyFeature = faker.helpers.arrayElement([
      'excellent safety features', 
      'intuitive controls', 
      'state-of-the-art infotainment', 
      'advanced driver assistance',
      'collision prevention systems',
      'adaptive cruise control',
      'lane keeping assistance'
    ]);
    
    // Create unique description with timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-5); // Use last 5 digits of timestamp for uniqueness
    const description = `The ${brand.name} ${model} is a ${carAdjective} 
      ${carType} with a ${engineSize} engine, 
      ${performanceDescription}.
      It features ${featureType} and 
      ${safetyFeature}. (Ref: ${timestamp})`;
    
    // Pick a random image name from available images
    const imgFileName = faker.helpers.arrayElement(availableImages);
    
    // Read the image file and convert to base64
    let imageData = null;
    let imgType = 'image/jpeg';
    try {
      const imagePath = path.join(__dirname, '../uploads', imgFileName);
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        imageData = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
      } else {
        // If image not found, use a default image
        const defaultPath = path.join(__dirname, '../uploads/default-car.jpg');
        if (fs.existsSync(defaultPath)) {
          const defaultBuffer = fs.readFileSync(defaultPath);
          imageData = `data:image/jpeg;base64,${defaultBuffer.toString('base64')}`;
        }
      }
    } catch (err) {
      console.error('Error reading image file:', err);
      // Continue without image if there's an error
    }
    
    // Create the car object - populate both make and brandId for compatibility
    return {
      make: brand.name,  // Keep the old field during transition
      brandId: brand.id,  // Use brandId for the new relationship
      model,
      year,
      keywords,
      description,
      fuelType,
      price,
      img: imageData,
      imgType
    };
  } catch (error) {
    console.error('Error generating car:', error);
    throw error;
  }
};

// Generate multiple cars
const generateCars = async (count) => {
  const newCars = [];
  for (let i = 0; i < count; i++) {
    try {
      const car = await generateCar();
      newCars.push(car);
    } catch (error) {
      console.error(`Error generating car #${i}:`, error);
    }
  }
  return newCars;
};

// Populate database with generated cars
const populateCars = async (count) => {
  try {
    const generatedCars = await generateCars(count);
    // Create cars in database using Sequelize
    const createdCars = await Car.bulkCreate(generatedCars);
    return createdCars;
  } catch (error) {
    console.error('Error populating cars:', error);
    throw error;
  }
};

// Validate car data
const validateCarData = (car) => {
  const errors = [];
  
  // Check required fields
  if (!car.brandId) {
    errors.push('Brand is required');
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
  
  if (!car.fuelType || car.fuelType.trim() === '') {
    errors.push('Fuel type is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Get paginated cars with optional filters
const getCars = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
    const offset = (page - 1) * itemsPerPage;
    
    // Build where conditions based on query parameters
    const whereConditions = {};

    // Handle search parameter across multiple fields
    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      if (searchTerm) {
        whereConditions[Op.or] = [
          // Search in make field
          { make: { [Op.iLike]: `%${searchTerm}%` } },
          // Search in model field
          { model: { [Op.iLike]: `%${searchTerm}%` } },
          // Search in keywords field
          { keywords: { [Op.iLike]: `%${searchTerm}%` } },
          // Search in description field
          { description: { [Op.iLike]: `%${searchTerm}%` } },
          // Search in fuelType field
          { fuelType: { [Op.iLike]: `%${searchTerm}%` } }
        ];
      }
    }

    if (req.query.make) {
      whereConditions.make = {
        [Op.in]: req.query.make.split(',')
      };
    }

    // Handle brand filtering by brandId (from frontend)
    if (req.query.brandId) {
      const brandIds = req.query.brandId.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (brandIds.length > 0) {
        whereConditions.brandId = {
          [Op.in]: brandIds
        };
      }
    }
    
    if (req.query.model) {
      whereConditions.model = {
        [Op.iLike]: `%${req.query.model}%`
      };
    }
    
    if (req.query.year) {
      whereConditions.year = parseInt(req.query.year);
    }
    
    if (req.query.fuelType) {
      whereConditions.fuelType = req.query.fuelType;
    }
    
    if (req.query.minPrice) {
      whereConditions.price = {
        ...whereConditions.price,
        [Op.gte]: parseFloat(req.query.minPrice)
      };
    }
    
    if (req.query.maxPrice) {
      whereConditions.price = {
        ...whereConditions.price,
        [Op.lte]: parseFloat(req.query.maxPrice)
      };
    }
    
    // Handle sorting
    let order = [['id', 'ASC']]; // Default sorting
    if (req.query.sortBy && req.query.sortOrder) {
      const field = req.query.sortBy;
      const direction = req.query.sortOrder.toUpperCase();
      
      // Only allow sorting by valid fields
      if (['price', 'year'].includes(field) && ['ASC', 'DESC'].includes(direction)) {
        order = [[field, direction]];
      }
    }
    
    // Include brand information
    const include = [{
      model: Brand,
      as: 'brand',
      attributes: ['id', 'name', 'country']
    }];
    
    // Get total count and cars
    const { count, rows } = await Car.findAndCountAll({
      where: whereConditions,
      include: include,
      limit: itemsPerPage,
      offset: offset,
      order: order // Apply the sorting
    });
    
    const totalPages = Math.ceil(count / itemsPerPage);
    
    res.json({
      cars: rows,
      currentPage: page,
      totalPages: totalPages,
      totalCars: count,
      itemsPerPage: itemsPerPage
    });
    
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

// Get car by ID
const getCarById = async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    
    // Create the include array
    const include = [
      {
        model: Brand,
        as: 'brand'
      }
    ];
      // Conditionally add User to the include array
    if (User) {
      include.push({
        model: User,
        as: 'owner',
        attributes: ['id', 'username', 'role'],
        required: false // Make this a left join so cars without owners still show up
      });
    }
    
    const car = await Car.findByPk(carId, { include });
    
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
      ...req.body
    };
    
    // Associate car with the current user if authenticated
    if (req.user) {
      carData.userId = req.user.id;
    }
    
    // Process image data if a file was uploaded
    if (req.file) {
      // Read the file into a Buffer
      const imageBuffer = fs.readFileSync(req.file.path);
      
      // Convert the image to Base64 and store it in the database
      carData.img = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
      carData.imgType = req.file.mimetype;
      
      // Delete the temporary file from disk after encoding
      fs.unlinkSync(req.file.path);
    } else {
      // If no image provided, use a default image
      const defaultImagePath = path.join(__dirname, '../uploads/default-car.jpg');
      if (fs.existsSync(defaultImagePath)) {
        const defaultImageBuffer = fs.readFileSync(defaultImagePath);
        carData.img = `data:image/jpeg;base64,${defaultImageBuffer.toString('base64')}`;
        carData.imgType = 'image/jpeg';
      } else {
        carData.img = null;
      }
    }
    
    // Convert brandId to number if it's a string
    if (carData.brandId && typeof carData.brandId === 'string') {
      carData.brandId = parseInt(carData.brandId);
    }
    
    // Check if brand exists
    if (carData.brandId) {
      const brand = await Brand.findByPk(carData.brandId);
      if (!brand) {
        return res.status(400).json({ errors: ['Selected brand does not exist'] });
      }
    }
    
    // Validate car data
    const validation = validateCarData(carData);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    // Create car in database
    const newCar = await Car.create(carData);
    
    // Fetch the created car with its brand information
    const carWithBrand = await Car.findByPk(newCar.id, {
      include: [
        {
          model: Brand,
          as: 'brand'
        }
      ]
    });
    
    res.status(201).json(carWithBrand);
  } catch (error) {
    console.error('Error creating car:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update car
const updateCar = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      console.log('Car update attempted without authentication');
      return res.status(401).json({ error: 'Authentication required', details: 'No user found in request' });
    }
    
    // Log the user attempting the update
    console.log(`Car update requested by user ID ${req.user.id}, username: ${req.user.username || 'unknown'}`);
    
    const carId = parseInt(req.params.id);
    
    // Find the car to update
    const car = await Car.findByPk(carId);
    
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    // Extract update data from request body
    const updatedData = { ...req.body };
    
    // Log update details
    console.log(`Updating car ID ${carId}, requested by user ${req.user ? req.user.username : 'unknown'}`);
    console.log(`Car before update:`, {
      make: car.make,
      model: car.model,
      hasImage: !!car.img,
      imageLength: car.img ? car.img.length : 0
    });
    
    // Convert brandId to number if it's a string
    if (updatedData.brandId && typeof updatedData.brandId === 'string') {
      updatedData.brandId = parseInt(updatedData.brandId);
    }
    
    // Check if brand exists
    if (updatedData.brandId) {
      const brand = await Brand.findByPk(updatedData.brandId);
      if (!brand) {
        return res.status(400).json({ errors: ['Selected brand does not exist'] });
      }
      // Set the make field to match the brand name for consistency
      updatedData.make = brand.name;
    }
      // If there's a new image, update the img property
    if (req.file) {
      try {
        // Log image upload details
        console.log(`Processing new image upload for car ID ${carId}: ${req.file.originalname} (${req.file.size} bytes, ${req.file.mimetype})`);
        
        // Check if the file exists
        if (!fs.existsSync(req.file.path)) {
          console.error(`Image file not found at path: ${req.file.path}`);
          return res.status(500).json({ error: 'Image processing failed - file not found' });
        }
        
        // Read the file into a Buffer
        const imageBuffer = fs.readFileSync(req.file.path);
        
        if (!imageBuffer || imageBuffer.length === 0) {
          console.error(`Empty image buffer for car ID ${carId}`);
          return res.status(500).json({ error: 'Image processing failed - empty file' });
        }
        
        // Convert the image to Base64 and store it in the database
        updatedData.img = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
        updatedData.imgType = req.file.mimetype;
        
        // Delete the temporary file from disk after encoding
        fs.unlinkSync(req.file.path);
        
        console.log(`New image successfully processed for car ID ${carId} (${imageBuffer.length} bytes)`);
      } catch (imageError) {
        console.error(`Error processing image for car ID ${carId}:`, imageError);
        return res.status(500).json({ error: 'Image processing failed' });
      }
    } else if (req.body.keepExistingImage === 'true') {
      // If keepExistingImage flag is set, explicitly remove img from updatedData
      // so the existing image is not overwritten
      console.log("Keeping existing image for car ID:", carId);
      console.log("Current car data:", JSON.stringify({ 
        hasImage: !!car.img, 
        imgType: car.imgType,
        imageSize: car.img ? car.img.length : 0
      }));
      delete updatedData.img;
      delete updatedData.imgType;
    } else {
      // No image provided and no flag to keep existing
      console.log("No image provided for update of car ID:", carId);
      console.log("Form data keys:", Object.keys(req.body).join(', '));
      console.log("Headers:", JSON.stringify(req.headers));
      
      // Check if we should clear the image
      if (req.body.clearImage === 'true') {
        console.log("Clearing image for car ID:", carId);
        updatedData.img = null;
        updatedData.imgType = null;
      } else {
        // Optional: set a default image or clear the image field
        // updatedData.img = null;
      }
    }
    
    // Convert price to number if it's a string
    if (updatedData.price && typeof updatedData.price === 'string') {
      updatedData.price = parseFloat(updatedData.price);
    }
    
    // Convert year to number if it's a string
    if (updatedData.year && typeof updatedData.year === 'string') {
      updatedData.year = parseInt(updatedData.year);
    }
    
    // Validate the updated car
    const validation = validateCarData({...car.toJSON(), ...updatedData});
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    // Update in database
    await car.update(updatedData);
    
    // Get the updated car with its brand
    const updatedCar = await Car.findByPk(carId, {
      include: [
        {
          model: Brand,
          as: 'brand'
        }
      ]
    });
    
    // Log the image data length for debugging
    if (updatedCar && updatedCar.img) {
      const imgLength = updatedCar.img.length;
      const imgPreview = updatedCar.img.substring(0, 50) + '...';
      console.log(`Updated car ${carId} has image with length ${imgLength} bytes. Preview: ${imgPreview}`);
    } else {
      console.log(`Updated car ${carId} has no image data`);
    }

    // Broadcast the car update via WebSocket
    if (req.app.locals.broadcast) {
      req.app.locals.broadcast({
        type: 'CAR_UPDATED',
        data: updatedCar,
        timestamp: Date.now()
      });
    }
    
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
    
    // Check if user owns this car or is an admin
    if (req.user && car.userId && car.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this car' });
    }
    
    // Delete from database
    await car.destroy();
    
    // Broadcast the car deletion via WebSocket
    if (req.app.locals.broadcast) {
      req.app.locals.broadcast({
        type: 'CAR_DELETED',
        data: { id: carId },
        timestamp: Date.now()
      });
    }
    
    res.json({ 
      message: 'Car deleted successfully',
      id: carId
    });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  validateCarData,
  generateCar,
  generateCars,
  populateCars
};