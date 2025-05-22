require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const dns = require('dns');
const sequelize = require('./config/database');

// Force IPv4

// async function initializeDatabase() {
//     try {
//         console.log('Initializing database connection...');
//         const sequelize = await getConnection();
        
//         // Initialize models
//         await initBrandModel();
//         await initCarModel();
//         await setupAssociations();
        
//         console.log('Models initialized successfully');
        
//         // Test connection with IPv4
//         await sequelize.authenticate({
//             retry: {
//                 max: 5,
//                 timeout: 60000,
//                 match: [
//                     'ETIMEDOUT',
//                     'ECONNREFUSED',
//                     'ENETUNREACH',
//                     'SequelizeConnectionError'
//                 ]
//             },
//             dialectOptions: {
//                 connectTimeout: 60000,
//                 family: 4,
//                 keepAlive: true
//             }
//         });

//         console.log('[Database] Connection established successfully');
//         return sequelize;
//     } catch (err) {
//         console.error('[Database] Initialization error:', {
//             message: err.message,
//             code: err.original?.code,
//             address: err.original?.address
//         });
//         throw err;
//     }
// }

// // Initialize database before starting Express
// initializeDatabase()
//     .then(sequelize => {
//         const app = express();
//         const PORT = process.env.PORT || 5000; // Changed from 3000 to 5000 to match frontend config

//         // Health check endpoint
//         app.get('/health', async (req, res) => {
//           try {
//             // Check database connection
//             await sequelize.authenticate({
//               // Force IPv4 for this check
//               dialectOptions: {
//                 connectTimeout: 10000,
//                 family: 4
//               }
//             });

//             // Check disk space for uploads
//             const uploadPath = path.join(__dirname, 'uploads');
//             const diskSpace = require('disk-space');
//             const space = await new Promise((resolve, reject) => {
//               diskSpace(uploadPath, (err, result) => {
//                 if (err) reject(err);
//                 else resolve(result);
//               });
//             });

//             res.status(200).json({ 
//               status: 'healthy', 
//               timestamp: new Date().toISOString(),
//               database: 'connected',
//               version: process.env.npm_package_version || '1.0.0',
//               uptime: process.uptime(),
//               memory: process.memoryUsage(),
//               diskSpace: space
//             });
//           } catch (error) {
//             console.error('Health check failed:', error);
//             res.status(500).json({ 
//               status: 'unhealthy', 
//               timestamp: new Date().toISOString(),
//               error: error.message,
//               errorName: error.name,
//               database: 'disconnected',
//               // Include connection retry info if available
//               retryAttempt: error.original?.retryAttempt || 0
//             });
//           }
//         });

//         // Middleware
//         app.use(cors({
//           origin: [
//             'http://localhost:5173', 
//             'http://127.0.0.1:5173', 
//             'http://localhost:80', 
//             'http://localhost',
//             'https://carshop-frontend.onrender.com',
//             'https://carshop-frontend-r48i.onrender.com',
//             'https://car-shop-rosy.vercel.app',
//             'https://car-shop-git-main-your-username.vercel.app', // Preview deployments
//             'https://car-shop.vercel.app',
//             process.env.FRONTEND_URL // Allow frontend URL from environment variable
//           ].filter(Boolean), // Remove null/undefined values
//           credentials: true,
//           methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//           allowedHeaders: [
//             'Content-Type', 
//             'Authorization',
//             'Cache-Control',
//             'Pragma',
//             'If-Modified-Since'
//           ]
//         }));
//         app.use(express.json());
//         app.use(express.urlencoded({ extended: true }));

//         // Static files for uploaded images
//         app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//         // Routes
//         const carRoutes = require('./routes/cars');
//         const brandRoutes = require('./routes/brands');
//         const statisticsRoutes = require('./routes/statistics');
//         const authRoutes = require('./routes/auth');
//         const { handleMulterError, handleGenericErrors } = require('./middleware/errorHandlers');

//         app.use('/api/cars', carRoutes);
//         app.use('/api/brands', brandRoutes);
//         app.use('/api/statistics', statisticsRoutes);
//         app.use('/api/auth', authRoutes);

//         // Error handling middleware
//         app.use(handleMulterError);
//         app.use(handleGenericErrors);

//         // Root route
//         app.get('/', (req, res) => {
//           res.send('Car Shop API is running');
//         });

//         // Start server
//         if (process.env.NODE_ENV !== 'test') {
//           app.listen(PORT, () => {
//             console.log(`Server is running on port ${PORT}`);
//           });
//         }

//         // Export app for testing
//         module.exports = app;
//     })
//     .catch(err => {
//         console.error('Fatal: Could not initialize database:', err);
//         process.exit(1);
//     });


  // index.js
  const User = require('./models/User');

  const app = express();

  const port = 5000;

  // testing the connection
  // this is a promise based function
  sequelize.authenticate().then(()=>{
    app.listen(port,()=> console.log(`Database connected successfully and app listening on port ${port}`))
  })
  .catch((error)=>{
    console.log(error.message)
  });
