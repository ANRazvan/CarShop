const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateCarData } = require('../controllers/carController');

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

// Import cars data
let { carsData, filterCars, getCars, getCarById, createCar, updateCar, deleteCar } = require('../controllers/carController');

// GET all cars with pagination and filtering
router.get('/', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
        const sortBy = req.query.sortBy;
        const sortOrder = req.query.sortOrder;
        const makeFilter = req.query.make ? req.query.make.split(',') : [];
        const fuelTypeFilter = req.query.fuelType ? req.query.fuelType.split(',') : [];
        const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
        const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
        const searchTerm = req.query.search || '';

        // Filter cars based on criteria
        let filteredCars = [...carsData.cars];

        // Apply make filter
        if (makeFilter.length > 0) {
            filteredCars = filteredCars.filter(car => makeFilter.includes(car.make));
        }

        // Apply fuel type filter
        if (fuelTypeFilter.length > 0) {
            filteredCars = filteredCars.filter(car => fuelTypeFilter.includes(car.fuelType));
        }

        // Apply price range filter
        if (minPrice !== null) {
            filteredCars = filteredCars.filter(car => parseFloat(car.price) >= minPrice);
        }
        if (maxPrice !== null) {
            filteredCars = filteredCars.filter(car => parseFloat(car.price) <= maxPrice);
        }

        // Apply search term filter (check in make, model, and description)
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filteredCars = filteredCars.filter(car => {
                return (
                    (car.make && car.make.toLowerCase().includes(lowerSearchTerm)) ||
                    (car.model && car.model.toLowerCase().includes(lowerSearchTerm)) ||
                    (car.description && car.description.toLowerCase().includes(lowerSearchTerm)) ||
                    (car.keywords && car.keywords.toLowerCase().includes(lowerSearchTerm))
                );
            });
        }

        // Apply sorting
        if (sortBy && sortOrder) {
            filteredCars.sort((a, b) => {
                // Convert string numbers to actual numbers for proper sorting
                const valA = sortBy === 'price' || sortBy === 'year' ? parseFloat(a[sortBy]) : a[sortBy];
                const valB = sortBy === 'price' || sortBy === 'year' ? parseFloat(b[sortBy]) : b[sortBy];
                
                // Handle case where values might be undefined
                if (valA === undefined && valB === undefined) return 0;
                if (valA === undefined) return 1;
                if (valB === undefined) return -1;
                
                // Sort ascending or descending
                if (sortOrder === 'asc') {
                    return valA < valB ? -1 : valA > valB ? 1 : 0;
                } else {
                    return valA > valB ? -1 : valA < valB ? 1 : 0;
                }
            });
        }

        // Handle "unlimited" case (itemsPerPage = -1)
        if (itemsPerPage === -1) {
            return res.json({
                cars: filteredCars,
                totalPages: 1,
                totalCars: filteredCars.length,
            });
        }

        // Apply pagination
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedCars = filteredCars.slice(startIndex, endIndex);

        res.json({
            cars: paginatedCars,
            totalPages: Math.ceil(filteredCars.length / itemsPerPage),
            totalCars: filteredCars.length,
        });
    } catch (error) {
        console.error("Error fetching cars:", error);
        res.status(500).json({ message: "Failed to fetch cars", error: error.message });
    }
});

// GET car by ID
router.get('/:id', (req, res) => {
    const carId = parseInt(req.params.id);
    const car = carsData.cars.find(car => car.id === carId);

    if (!car) {
        return res.status(404).json({ message: "Car not found" });
    }

    res.json(car);
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
        const carIndex = carsData.cars.findIndex(car => car.id === carId);

        if (carIndex === -1) {
            return res.status(404).json({ message: "Car not found" });
        }

        const updatedCar = {
            ...carsData.cars[carIndex],
            ...req.body,
        };

        if (req.file) {
            updatedCar.img = req.file.filename;
        }

        carsData.cars[carIndex] = updatedCar; // Ensure this line is updating the array
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

// POST upload video for a car
router.post('/:id/video', upload.single('video'), (req, res) => {
    try {
        const carId = parseInt(req.params.id);
        const carIndex = carsData.cars.findIndex(car => car.id === carId);
        
        if (carIndex === -1) {
            return res.status(404).json({ message: "Car not found" });
        }
        
        if (!req.file) {
            return res.status(400).json({ message: "No video file uploaded" });
        }
        
        // If there was a previous video, delete it
        if (carsData.cars[carIndex].video) {
            const oldVideoPath = path.join(__dirname, '../uploads/videos', carsData.cars[carIndex].video);
            if (fs.existsSync(oldVideoPath)) {
                fs.unlinkSync(oldVideoPath);
            }
        }
        
        // Update car with new video
        carsData.cars[carIndex].video = req.file.filename;
        
        res.json({ 
            message: "Video uploaded successfully",
            car: carsData.cars[carIndex]
        });
    } catch (error) {
        console.error("Error uploading video:", error);
        res.status(500).json({ message: "Failed to upload video", error: error.message });
    }
});

// DELETE video for a car
router.delete('/:id/video', (req, res) => {
    try {
        const carId = parseInt(req.params.id);
        const carIndex = carsData.cars.findIndex(car => car.id === carId);
        
        if (carIndex === -1) {
            return res.status(404).json({ message: "Car not found" });
        }
        
        // If the car has a video, delete it
        if (carsData.cars[carIndex].video) {
            const videoPath = path.join(__dirname, '../uploads/videos', carsData.cars[carIndex].video);
            if (fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
            }
            
            // Remove video reference from car
            carsData.cars[carIndex].video = null;
            
            res.json({ 
                message: "Video deleted successfully",
                car: carsData.cars[carIndex]
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