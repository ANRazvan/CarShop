require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/supabase-db');
const { setupAssociations } = require('./models/associations');

// Set up model associations
setupAssociations();

const carRoutes = require('./routes/cars');
const brandRoutes = require('./routes/brands');
const statisticsRoutes = require('./routes/statistics');
const authRoutes = require('./routes/auth');
const { handleMulterError, handleGenericErrors } = require('./middleware/errorHandlers');

const app = express();
const PORT = process.env.PORT || 5000; // Changed from 3000 to 5000 to match frontend config

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await sequelize.authenticate();
    
    // Check disk space for uploads
    const uploadPath = path.join(__dirname, 'uploads');
    const diskSpace = require('disk-space');
    const space = await new Promise((resolve, reject) => {
      diskSpace(uploadPath, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      diskSpace: space
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      error: error.message,
      database: error.name === 'SequelizeConnectionError' ? 'disconnected' : 'unknown'
    });
  }
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173', 
    'http://localhost:80', 
    'http://localhost',
    'https://carshop-frontend.onrender.com',
    'https://carshop-frontend-r48i.onrender.com',
    'https://car-shop-rosy.vercel.app',
    'https://car-shop-git-main-your-username.vercel.app', // Preview deployments
    'https://car-shop.vercel.app',
    process.env.FRONTEND_URL // Allow frontend URL from environment variable
  ].filter(Boolean), // Remove null/undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'Cache-Control',
    'Pragma',
    'If-Modified-Since'
  ]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/cars', carRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use(handleMulterError);
app.use(handleGenericErrors);

// Root route
app.get('/', (req, res) => {
  res.send('Car Shop API is running');
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app; // Export for testing
