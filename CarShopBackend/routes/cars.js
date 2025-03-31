// filepath: CarShopBackend/routes/cars.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar
} = require('../controllers/carController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Get all cars with pagination and filtering
router.get('/', getCars);

// Get a specific car by ID
router.get('/:id', getCarById);

// Create a new car (with optional image upload)
router.post('/', upload.single('image'), createCar);

// Update a car (with optional image upload)
router.put('/:id', upload.single('image'), updateCar);

// Delete a car
router.delete('/:id', deleteCar);

module.exports = router;