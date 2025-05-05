const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { WebSocketServer } = require('ws');
const http = require('http');
const carRoutes = require('./routes/cars');
const brandRoutes = require('./routes/brands');
const { connectDB, sequelize } = require('./config/pgdb');
const Car = require('./models/Car');
const Brand = require('./models/Brand');
const setupAssociations = require('./models/associations');
require('dotenv').config();

// Initialize model associations
setupAssociations();

const app = express();
const port = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Set appropriate size limits for request payloads
app.use(express.json({ limit: '2048mb' }));
app.use(express.urlencoded({ extended: true, limit: '2048mb' }));

// Configure CORS with explicit options
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Setup WebSocket server with explicit path
const wss = new WebSocketServer({ 
    server,
    path: '/ws'
});

// Store connected clients
const clients = new Set();

// WebSocket handling
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // Add client to our set
    clients.add(ws);
    
    // Set up ping interval to keep connection alive
    const pingInterval = setInterval(() => {
        if (ws.readyState === 1) { // OPEN
            try {
                ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
            } catch (e) {
                console.error('Error sending ping:', e);
                clearInterval(pingInterval);
            }
        }
    }, 30000); // send ping every 30 seconds
    
    // Handle client disconnect
    ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
        clients.delete(ws);
        clearInterval(pingInterval); // Clear the ping interval when connection closes
    });
    
    // Handle messages from client
    ws.on('message', (message) => {
        console.log('Received message:', message.toString());
        
        // Process messages from clients
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.type === 'PING') {
                ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
            } else if (parsedMessage.type === 'PONG') {
                // Client responded to our ping, connection is still alive
                console.log('Received pong from client');
            }
        } catch (e) {
            console.error('Error parsing WebSocket message:', e);
        }
    });
    
    // Send initial message to confirm connection
    try {
        ws.send(JSON.stringify({ 
            type: 'CONNECTED', 
            message: 'Connected to Car Shop WebSocket Server',
            timestamp: Date.now()
        }));
    } catch (e) {
        console.error('Error sending initial connection message:', e);
    }
});

// Broadcast to all connected clients
const broadcast = (message) => {
    clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
            client.send(JSON.stringify(message));
        }
    });
};

// Configure file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
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

// Make uploads directory accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Make videos directory accessible for large files
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos'), {
    maxAge: '1d', // Cache for 1 day
    setHeaders: (res, path) => {
        if (path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.ogg')) {
            res.setHeader('Content-Type', `video/${path.split('.').pop()}`);
        }
    }
}));

// Middleware
app.use(express.json());

// Store the broadcast function for use in routes
app.locals.broadcast = broadcast;

// Routes
app.use('/api/cars', (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(body) {
        // Check what type of operation it was and broadcast appropriate message
        if (req.method === 'POST' && res.statusCode === 201) {
            // Create operation
            broadcast({
                type: 'CAR_CREATED',
                data: body,
                timestamp: Date.now()
            });
        } else if (req.method === 'PUT' && res.statusCode === 200) {
            // Update operation
            broadcast({
                type: 'CAR_UPDATED',
                data: body,
                timestamp: Date.now()
            });
        } else if (req.method === 'DELETE' && res.statusCode === 200) {
            // Delete operation
            broadcast({
                type: 'CAR_DELETED',
                data: { id: req.params.id },
                timestamp: Date.now()
            });
        }
        
        return originalJson.call(this, body);
    };
    
    next();
}, carRoutes);

// Brand routes with WebSocket support
app.use('/api/brands', (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(body) {
        // Check what type of operation it was and broadcast appropriate message
        if (req.method === 'POST' && res.statusCode === 201) {
            // Create operation
            broadcast({
                type: 'BRAND_CREATED',
                data: body,
                timestamp: Date.now()
            });
        } else if (req.method === 'PUT' && res.statusCode === 200) {
            // Update operation
            broadcast({
                type: 'BRAND_UPDATED',
                data: body,
                timestamp: Date.now()
            });
        } else if (req.method === 'DELETE' && res.statusCode === 200) {
            // Delete operation
            broadcast({
                type: 'BRAND_DELETED',
                data: { id: req.params.id },
                timestamp: Date.now()
            });
        }
        
        return originalJson.call(this, body);
    };
    
    next();
}, brandRoutes);

// Connect to PostgreSQL database and start the server
connectDB()
  .then(async () => {
    // Sync models with database without dropping tables
    await sequelize.sync();
    console.log('Database synced with existing tables');
    
    // Add imgType column if it doesn't exist
    try {
      // Check if the column exists in the Cars table
      await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='Cars' AND column_name='imgType'
      `);
      
      // Add the column if it doesn't exist
      await sequelize.query(`
        ALTER TABLE "Cars" 
        ADD COLUMN IF NOT EXISTS "imgType" VARCHAR(255) DEFAULT 'image/jpeg'
      `);
      console.log('Added imgType column to Cars table if it did not exist');
      
      // Also modify the img column to be TEXT type to support Base64 encoded images
      await sequelize.query(`
        ALTER TABLE "Cars" 
        ALTER COLUMN "img" TYPE TEXT
      `);
      console.log('Modified img column to TEXT type for Base64 storage');
      
      // Convert existing image paths to Base64
      const cars = await Car.findAll();
      console.log(`Converting ${cars.length} car images to Base64 format...`);
      
      let convertedCount = 0;
      for (const car of cars) {
        // Skip if already in Base64 format
        if (car.img && !car.img.startsWith('data:')) {
          try {
            const imagePath = path.join(__dirname, 'uploads', car.img);
            if (fs.existsSync(imagePath)) {
              // Read file and convert to Base64
              const imageBuffer = fs.readFileSync(imagePath);
              // Detect mimetype based on file extension
              const ext = path.extname(car.img).toLowerCase();
              let mimeType = 'image/jpeg'; // Default
              if (ext === '.png') mimeType = 'image/png';
              if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
              
              // Update the car record with Base64 data
              car.img = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
              car.imgType = mimeType;
              await car.save();
              convertedCount++;
            }
          } catch (err) {
            console.error(`Error converting image for car ID ${car.id}:`, err);
          }
        }
      }
      console.log(`Successfully converted ${convertedCount} images to Base64 format`);
      
    } catch (error) {
      console.error('Error updating Cars table schema:', error);
    }
    
    // Start the server after database connection is established
    server.listen(port, async () => {
      console.log(`Server running on port ${port}`);
      console.log(`WebSocket server is ready`);
      
      try {
        // Initialize brands data if empty
        const { populateInitialBrands } = require('./controllers/brandController');
        const brandsCreated = await populateInitialBrands();
        if (brandsCreated > 0) {
          console.log(`Created ${brandsCreated} initial brands`);
        }
        
        // Initialize the database with some cars if empty
        const carCount = await Car.count();
        if (carCount === 0) {
          // Generate 20 random cars on startup
          const numCarsToGenerate = 20;
          const { populateCars } = require('./controllers/carController');
          const generatedCars = await populateCars(numCarsToGenerate);
          console.log(`Generated ${generatedCars.length} cars on startup`);
        } else {
          console.log(`Server started with ${carCount} existing cars`);
        }
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    });
  })
  .catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });