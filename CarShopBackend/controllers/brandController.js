// filepath: CarShopBackend/controllers/brandController.js
const { Op } = require('sequelize');
const Brand = require('../models/Brand');
const Car = require('../models/Car');
const { sequelize } = require('../config/pgdb'); // Add this import

// Get all brands with optional filtering and sorting
const getBrands = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.itemsPerPage) || parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Extract filter parameters
    const name = req.query.name || '';
    const country = req.query.country ? req.query.country.split(',') : null;
    const minFoundedYear = req.query.minFoundedYear ? parseInt(req.query.minFoundedYear) : null;
    const maxFoundedYear = req.query.maxFoundedYear ? parseInt(req.query.maxFoundedYear) : null;
    
    // Build the query conditions
    const whereConditions = {};
    
    // Filter by name
    if (name) {
      whereConditions.name = { [Op.iLike]: `%${name}%` };
    }
    
    // Filter by country
    if (country && country.length > 0) {
      whereConditions.country = { [Op.in]: country };
    }
    
    // Filter by founded year range
    if (minFoundedYear || maxFoundedYear) {
      whereConditions.foundedYear = {};
      if (minFoundedYear) {
        whereConditions.foundedYear[Op.gte] = minFoundedYear;
      }
      if (maxFoundedYear) {
        whereConditions.foundedYear[Op.lte] = maxFoundedYear;
      }
    }
    
    // Set up sorting
    let order = [];
    if (req.query.sortBy) {
      const sortBy = req.query.sortBy;
      const sortOrder = req.query.sortOrder || 'ASC';
      order.push([sortBy, sortOrder.toUpperCase()]);
    } else {
      order.push(['name', 'ASC']);
    }
    
    // Query the database with all filters applied
    const { count, rows } = await Brand.findAndCountAll({
      where: whereConditions,
      order,
      limit,
      offset,
      include: [
        {
          model: Car,
          as: 'cars',
          attributes: ['id', 'model'] // Include only necessary attributes
        }
      ]
    });
    
    // Get unique countries for filtering options
    const countries = await Brand.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('country')), 'country']],
      raw: true
    });
    
    const totalPages = Math.ceil(count / limit);
    
    res.json({
      brands: rows,
      currentPage: page,
      totalPages,
      totalBrands: count,
      countries: countries.map(c => c.country).filter(Boolean) // Filter out null values
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get brand by ID
const getBrandById = async (req, res) => {
  try {
    const brandId = parseInt(req.params.id);
    const brand = await Brand.findByPk(brandId, {
      include: [
        {
          model: Car,
          as: 'cars',
        }
      ]
    });
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    res.json(brand);
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new brand
const createBrand = async (req, res) => {
  try {
    const brandData = {
      ...req.body,
      logo: req.file ? req.file.filename : 'default-logo.png'
    };
    
    // Validate brand data
    if (!brandData.name) {
      return res.status(400).json({ errors: ['Brand name is required'] });
    }
    
    // Check if brand already exists
    const existingBrand = await Brand.findOne({
      where: {
        name: brandData.name
      }
    });
    
    if (existingBrand) {
      return res.status(400).json({ errors: ['Brand with this name already exists'] });
    }
    
    // Create brand in database
    const newBrand = await Brand.create(brandData);
    
    res.status(201).json(newBrand);
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update brand
const updateBrand = async (req, res) => {
  try {
    const brandId = parseInt(req.params.id);
    const brand = await Brand.findByPk(brandId);
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    // Update brand data
    const updatedData = {
      ...req.body
    };
    
    // If there's a new logo, update the logo property
    if (req.file) {
      updatedData.logo = req.file.filename;
    }
    
    // Check if name is being updated and if it already exists
    if (updatedData.name && updatedData.name !== brand.name) {
      const existingBrand = await Brand.findOne({
        where: {
          name: updatedData.name
        }
      });
      
      if (existingBrand) {
        return res.status(400).json({ errors: ['Brand with this name already exists'] });
      }
    }
    
    // Update in database
    await brand.update(updatedData);
    
    // Get the updated brand with its cars
    const updatedBrand = await Brand.findByPk(brandId, {
      include: [
        {
          model: Car,
          as: 'cars',
        }
      ]
    });
    
    res.json(updatedBrand);
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete brand
const deleteBrand = async (req, res) => {
  try {
    const brandId = parseInt(req.params.id);
    const brand = await Brand.findByPk(brandId);
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    // Check if brand has associated cars
    const carCount = await Car.count({
      where: {
        brandId: brandId
      }
    });
    
    if (carCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete brand that has associated cars',
        carCount: carCount
      });
    }
    
    // Delete from database
    await brand.destroy();
    
    res.json({ 
      message: 'Brand deleted successfully',
      id: brandId
    });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all cars for a specific brand
const getBrandCars = async (req, res) => {
  try {
    const brandId = parseInt(req.params.id);
    const brand = await Brand.findByPk(brandId);
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.itemsPerPage) || parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Query the database to get cars for this brand
    const { count, rows } = await Car.findAndCountAll({
      where: {
        brandId: brandId
      },
      limit,
      offset,
      order: [['model', 'ASC']]
    });
    
    const totalPages = Math.ceil(count / limit);
    
    res.json({
      brand: {
        id: brand.id,
        name: brand.name
      },
      cars: rows,
      currentPage: page,
      totalPages,
      totalCars: count
    });
  } catch (error) {
    console.error('Error fetching brand cars:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Populate brands with initial data
const populateInitialBrands = async () => {
  const brandsData = [
    { name: 'Toyota', country: 'Japan', foundedYear: 1937, description: 'Toyota Motor Corporation is a Japanese multinational automotive manufacturer.' },
    { name: 'Honda', country: 'Japan', foundedYear: 1948, description: 'Honda Motor Co., Ltd. is a Japanese public multinational conglomerate manufacturer of automobiles, motorcycles, and power equipment.' },
    { name: 'Ford', country: 'USA', foundedYear: 1903, description: 'Ford Motor Company is an American multinational automobile manufacturer.' },
    { name: 'BMW', country: 'Germany', foundedYear: 1916, description: 'Bayerische Motoren Werke AG, commonly known as BMW, is a German multinational manufacturer of luxury vehicles and motorcycles.' },
    { name: 'Mercedes-Benz', country: 'Germany', foundedYear: 1926, description: 'Mercedes-Benz, commonly referred to as Mercedes, is a German luxury and commercial vehicle automotive brand established in 1926.' },
    { name: 'Audi', country: 'Germany', foundedYear: 1909, description: 'Audi AG is a German automotive manufacturer of luxury vehicles.' },
    { name: 'Volkswagen', country: 'Germany', foundedYear: 1937, description: 'Volkswagen is a German motor vehicle manufacturer.' },
    { name: 'Hyundai', country: 'South Korea', foundedYear: 1967, description: 'Hyundai Motor Company is a South Korean multinational automotive manufacturer.' },
    { name: 'Kia', country: 'South Korea', foundedYear: 1944, description: 'Kia Corporation, commonly known as Kia, is a South Korean multinational automobile manufacturer.' },
    { name: 'Nissan', country: 'Japan', foundedYear: 1933, description: 'Nissan Motor Corporation Ltd. is a Japanese multinational automobile manufacturer.' },
    { name: 'Mazda', country: 'Japan', foundedYear: 1920, description: 'Mazda Motor Corporation is a Japanese multinational automaker.' }
  ];
  
  const existingBrands = await Brand.findAll();
  
  if (existingBrands.length === 0) {
    // No brands exist, create them all
    await Brand.bulkCreate(brandsData);
    console.log(`Created ${brandsData.length} initial brands`);
    return brandsData.length;
  } else {
    console.log(`Brands already exist, not creating initial data`);
    return 0;
  }
};

module.exports = {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandCars,
  populateInitialBrands
};