const { faker } = require('@faker-js/faker'); 
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const Car = require('../models/Car');
const Brand = require('../models/Brand');
const User = require('../models/User');
const { sequelize } = require('../config/pgdb');
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
    // Check for itemsPerPage parameter first, then fall back to limit
    let limit = parseInt(req.query.itemsPerPage) || parseInt(req.query.limit) || 10;
    
    // Handle the special case for unlimited items - very important for getting all cars!
    const isUnlimited = limit === -1;
    // When unlimited is requested, we don't apply any limit to the query
    const useLimit = isUnlimited ? null : limit;
    
    // For unlimited query, we don't want any offset
    const offset = isUnlimited ? 0 : (page - 1) * limit;
    
    // Extract filter parameters
    const brandIds = req.query.brandId ? req.query.brandId.split(',').map(id => parseInt(id)) : null;
    const fuelType = req.query.fuelType ? req.query.fuelType.split(',') : null;
    const search = req.query.search || '';
    
    // Build the query conditions
    const whereConditions = {};
    
    // Filter by brandId
    if (brandIds && brandIds.length > 0) {
      whereConditions.brandId = { [Op.in]: brandIds };
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
    }    // Include Brand and User in results
    const include = [];
    // const include = [
    //   {
    //     model: Brand,
    //     as: 'brand',
    //     attributes: ['id', 'name', 'country'] // Include only necessary brand attributes
    //   }
    // ];

    // Remove the try/catch block that's causing issues and log a message
    console.log('Skipping User model inclusion due to configuration issues on the server');
  

    
    // Create the query options object
    const queryOptions = {
      where: whereConditions,
      order,
      offset,
      include
    };
    
    // Only add the limit if it's not for unlimited items
    if (!isUnlimited) {
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
    
    // Query the database with all filters applied
    const { count, rows } = await Car.findAndCountAll(queryOptions);
    
    // Log detailed information about the results
    console.log(`Found ${rows.length} cars out of ${count} total matches`);
    
    // Get unique brands for filtering options
    const brands = await Brand.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    
    // Get unique fuel types for filtering options
    const fuelTypes = await Car.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('fuelType')), 'fuelType']],
      raw: true
    });
    
    const totalPages = isUnlimited ? 1 : Math.ceil(count / limit);
    
    res.json({
      cars: rows,
      currentPage: page,
      totalPages,
      totalCars: count,
      brands: brands,
      fuelTypes: fuelTypes.map(f => f.fuelType).filter(Boolean), // Filter out null values
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
    
    // Create the include array
    const include = [
      {
        model: Brand,
        as: 'brand'
      }
    ];
    
    // Conditionally add User to the include array
    // if (User) {
    //   include.push({
    //     model: User,
    //     as: 'owner',
    //     attributes: ['id', 'username', 'role'],
    //     required: false // Make this a left join so cars without owners still show up
    //   });
    // }
    
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
        
        console.log(`New image successfully processed for car ID ${carId} (${imageBuffer.length} bytes)`);
        
        // Delete the temporary file from disk after encoding
        fs.unlinkSync(req.file.path);
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