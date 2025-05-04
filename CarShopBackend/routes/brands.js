// filepath: CarShopBackend/routes/brands.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  getBrands, 
  getBrandById, 
  createBrand, 
  updateBrand, 
  deleteBrand,
  getBrandCars 
} = require('../controllers/brandController');

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/logos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, 'brand-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml'];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpg, .jpeg, .png, and .svg file formats allowed for brand logos'));
    }
  }
});

// GET all brands with filtering and pagination
router.get('/', getBrands);

// GET brand by ID
router.get('/:id', getBrandById);

// GET all cars for a specific brand
router.get('/:id/cars', getBrandCars);

// POST create a new brand
router.post('/', upload.single('logo'), createBrand);

// PUT update an existing brand
router.put('/:id', upload.single('logo'), updateBrand);

// DELETE brand by ID
router.delete('/:id', deleteBrand);

module.exports = router;