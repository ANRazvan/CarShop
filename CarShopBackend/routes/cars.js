const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateCarData } = require('../controllers/carController');

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only .jpg, .jpeg and .png file formats allowed'));
        }
    }
});

// Import cars data
let { carsData, filterCars, getCars, getCarById, createCar, updateCar, deleteCar } = require('../controllers/carController');

// GET all cars with pagination and filtering
router.get('/', (req, res) => {
    getCars(req, res);
});

// GET car by ID
router.get('/:id', (req, res) => {
    getCarById(req, res);
});

// // Add this debug endpoint to CarShopBackend/routes/cars.js
// router.get('/debug', (req, res) => {
//   // Return car data length and first few items
//   res.json({
//       totalCars: carsData.cars.length,
//       firstFew: carsData.cars.slice(0, 3)
//   });
// });

// POST create a new car
router.post('/', upload.single('image'), (req, res) => {
    try {
        // Extract car data from request
        const { make, model, year, fuelType, price, description, keywords } = req.body;
        let img = '';
        
        if (req.file) {
            img = req.file.filename;
        }
        
        // Validate car data
        const carData = { make, model, year, fuelType, price, description, keywords, img };
        const validation = validateCarData(carData);
        
        if (!validation.valid) {
            return res.status(400).json({ errors: validation.errors });
        }
        
        // Generate a new ID (simple increment for now)
        const newId = carsData.cars.reduce((maxId, car) => Math.max(maxId, car.id), 0) + 1;
        
        // Create the new car object
        const newCar = {
            id: newId,
            ...carData
        };
        
        // Add to the cars array
        carsData.cars.push(newCar);
        
        // Return the created car
        res.status(201).json(newCar);
    } catch (error) {
        console.error("Error creating car:", error);
        res.status(500).json({ message: "Failed to create car", error: error.message });
    }
});

// PUT update an existing car
router.put('/:id', upload.single('image'), (req, res) => {
    try {
        const carId = parseInt(req.params.id);
        
        // Find the car by ID
        const carIndex = carsData.cars.findIndex(car => car.id === carId);
        
        if (carIndex === -1) {
            return res.status(404).json({ message: "Car not found" });
        }
        
        // Extract updated data from request
        const { make, model, year, fuelType, price, description, keywords } = req.body;
        
        // Update only provided fields
        const updatedCar = {
            ...carsData.cars[carIndex],
            make: make || carsData.cars[carIndex].make,
            model: model || carsData.cars[carIndex].model,
            year: year || carsData.cars[carIndex].year,
            fuelType: fuelType || carsData.cars[carIndex].fuelType,
            price: price || carsData.cars[carIndex].price,
            description: description || carsData.cars[carIndex].description,
            keywords: keywords || carsData.cars[carIndex].keywords,
        };
        
        // Update image if provided
        if (req.file) {
            // Remove old image if it exists
            const oldImage = carsData.cars[carIndex].img;
            if (oldImage) {
                const imagePath = path.join(__dirname, '../uploads', oldImage);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            
            updatedCar.img = req.file.filename;
        }
        
        // Validate the updated car data
        const validation = validateCarData(updatedCar);
        if (!validation.valid) {
            return res.status(400).json({ errors: validation.errors });
        }
        
        // Update the car in the data array
        carsData.cars[carIndex] = updatedCar;
        
        // Return the updated car
        res.json(updatedCar);
    } catch (error) {
        console.error("Error updating car:", error);
        res.status(500).json({ message: "Failed to update car", error: error.message });
    }
});

// DELETE car by ID
router.delete('/:id', (req, res) => {
    try {
        const carId = parseInt(req.params.id);
        
        // Find the car by ID
        const carIndex = carsData.cars.findIndex(car => car.id === carId);
        
        if (carIndex === -1) {
            return res.status(404).json({ message: "Car not found" });
        }
        
        // Remove car from array
        const deletedCar = carsData.cars.splice(carIndex, 1)[0];
        
        // Clean up image file if it exists
        if (deletedCar.img) {
            const imagePath = path.join(__dirname, '../uploads', deletedCar.img);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        res.json({ 
            message: "Car deleted successfully",
            id: carId
        });
    } catch (error) {
        console.error("Error deleting car:", error);
        res.status(500).json({ message: "Failed to delete car", error: error.message });
    }
});

module.exports = router;