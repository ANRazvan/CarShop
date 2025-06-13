const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateCarData } = require('../controllers/carController');
const Car = require('../models/Car'); // Import the Car model
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');
const { handleMulterError } = require('../middleware/errorHandlers');

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Choose destination based on file type
        let uploadPath;
        if (file.fieldname === 'video') {
            uploadPath = path.join(__dirname, '../uploads/videos');
        } else {
            uploadPath = path.join(__dirname, '../uploads');
        }
        
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2048 * 1024 * 1024, // 1GB file size limit
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'video') {
            const allowedVideoTypes = [
                'video/mp4', 'video/webm', 'video/ogg', 
                'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'
            ];
            if (allowedVideoTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only common video formats are allowed (mp4, webm, ogg, mov, avi, wmv)'));
            }
        } else if (file.fieldname === 'image') {
            const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (allowedImageTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only .jpg, .jpeg and .png file formats allowed for images'));
            }
        } else {
            cb(new Error('Unexpected field type'));
        }
    }
});

// Import controller functions - use database controllers instead of in-memory data
const { getCars, getCarById, createCar, updateCar, deleteCar, populateCars } = require('../controllers/carController');
const { auth, logAction } = require('../middleware/authMiddleware');
const { getMyCars, checkCarOwnership, assignCarOwner } = require('../controllers/userCarController');

// Debugging endpoint to check all cars (without pagination/filtering)
router.get('/debug/all/cars', async (req, res) => {
  try {
    // Direct database query without any filtering or limits
    const cars = await Car.findAll({
      order: [['id', 'ASC']]
    });
    
    // Check specifically for ID 14
    const hasID14 = cars.some(car => car.id === 14);
    
    res.json({
      message: "All cars retrieved",
      totalCars: cars.length,
      hasID14: hasID14,
      cars: cars
    });
  } catch (error) {
    console.error('Error retrieving all cars:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debugging endpoint to check for specific car by ID
router.get('/debug/:id', async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    const car = await Car.findByPk(carId);
    
    if (!car) {
      return res.status(404).json({ 
        message: "Car not found", 
        id: carId,
        exists: false 
      });
    }
    
    res.json({
      message: "Car found",
      exists: true,
      car: car
    });
  } catch (error) {
    console.error('Error finding car:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all cars with pagination and filtering - use the database controller
router.get('/', getCars);

// GET user's cars - requires authentication
router.get('/mycars', authenticate, getMyCars);

// GET car by ID - use the database controller
router.get('/:id', getCarById);

// POST generate random cars - admin only
router.post('/generate/:count', authenticate, authorizeAdmin, (req, res) => {
    try {
        const count = parseInt(req.params.count);
        
        if (isNaN(count) || count <= 0 || count > 100) {
            return res.status(400).json({ 
                message: "Invalid count. Please provide a number between 1 and 100."
            });
        }
          // Generate the requested number of cars with the current user's ID
        populateCars(count, req.user.id)
            .then(generatedCars => {
                // Broadcast event about the new cars if the broadcast function is available
                if (req.app.locals.broadcast) {
                    generatedCars.forEach(car => {
                        req.app.locals.broadcast({
                            type: 'CAR_CREATED',
                            data: car,
                            timestamp: Date.now()
                        });
                    });
                }
                
                res.status(201).json({
                    message: `Successfully generated ${count} cars`,
                    carsGenerated: count,
                    totalCars: generatedCars.length,
                    generatedCars
                });
            })
            .catch(error => {
                console.error("Error generating cars:", error);
                res.status(500).json({ message: "Failed to generate cars", error: error.message });
            });
    } catch (error) {
        console.error("Error generating cars:", error);
        res.status(500).json({ message: "Failed to generate cars", error: error.message });
    }
});

// POST create a new car - use the database controller (requires authentication)
router.post('/', authenticate, logAction('CREATE', 'CAR'), upload.single('image'), createCar);

// PUT update an existing car - use the database controller (requires authentication)
router.put('/:id', authenticate, logAction('UPDATE', 'CAR'), 
    // Add debug middleware for image uploads
    (req, res, next) => {
        console.log(`[DEBUG] Car update request for ID ${req.params.id}`);
        console.log(`[DEBUG] Request has ${req.headers['content-type']}`);
        console.log(`[DEBUG] Form field keys: ${Object.keys(req.body || {}).join(', ')}`);
        next();
    },
    // Use multer for file upload with error handling
    (req, res, next) => {
        upload.single('image')(req, res, (err) => {
            if (err) {
                // Forward to our multer error handler
                return handleMulterError(err, req, res, next);
            }
            next();
        });
    },
    // Add post-upload middleware
    (req, res, next) => {
        console.log(`[DEBUG] After multer processing:`);
        console.log(`[DEBUG] File uploaded: ${req.file ? 'Yes' : 'No'}`);
        if (req.file) {
            console.log(`[DEBUG] File details: ${req.file.originalname}, ${req.file.size} bytes, ${req.file.mimetype}`);
        }
        console.log(`[DEBUG] Keep existing image flag: ${req.body.keepExistingImage || 'not set'}`);
        next();
    },
    updateCar);

// DELETE car by ID - use the database controller (requires authentication)
router.delete('/:id', authenticate, logAction('DELETE', 'CAR'), deleteCar);

// POST upload video for a car (requires authentication)
router.post('/:id/video', authenticate, upload.single('video'), async (req, res) => {
    try {
        const carId = parseInt(req.params.id);
        const car = await Car.findByPk(carId);
        
        // Check if user owns this car or is an admin
        if (req.user && car.userId && car.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You do not have permission to modify this car' });
        }
        
        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }
        
        if (!req.file) {
            return res.status(400).json({ message: "No video file uploaded" });
        }
        
        // If there was a previous video, delete it
        if (car.video) {
            const oldVideoPath = path.join(__dirname, '../uploads/videos', car.video);
            if (fs.existsSync(oldVideoPath)) {
                fs.unlinkSync(oldVideoPath);
            }
        }
        
        // Update car with new video
        await car.update({ video: req.file.filename });
        
        res.json({ 
            message: "Video uploaded successfully",
            car: car
        });
    } catch (error) {
        console.error("Error uploading video:", error);
        res.status(500).json({ message: "Failed to upload video", error: error.message });
    }
});

// DELETE video for a car (requires authentication)
router.delete('/:id/video', authenticate, async (req, res) => {
    try {
        const carId = parseInt(req.params.id);
        const car = await Car.findByPk(carId);
        
        // Check if user owns this car or is an admin
        if (req.user && car.userId && car.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You do not have permission to modify this car' });
        }
        
        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }
        
        // If the car has a video, delete it
        if (car.video) {
            const videoPath = path.join(__dirname, '../uploads/videos', car.video);
            if (fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
            }
            
            // Remove video reference from car
            await car.update({ video: null });
            
            res.json({ 
                message: "Video deleted successfully",
                car: car
            });
        } else {
            res.status(404).json({ message: "No video found for this car" });
        }
    } catch (error) {
        console.error("Error deleting video:", error);
        res.status(500).json({ message: "Failed to delete video", error: error.message });
    }
});

module.exports = router;