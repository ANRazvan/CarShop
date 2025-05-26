require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const WebSocket = require('ws');
const http = require('http');
const session = require('express-session');
const app = express();
const port = process.env.PORT || 5000;
const setupAssociations = require('./models/associations');
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

setupAssociations();

// Initialize broadcast function
app.locals.broadcast = (message) => {
  console.log('Broadcasting WebSocket message:', message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  // Send welcome message
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to CarShop WebSocket server' }));
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      
      // Handle ping messages
      if (parsedMessage.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
      
      // Handle other message types as needed
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Configure middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173', 
    'http://localhost:80', 
    'http://localhost',
    'https://carshop-frontend.onrender.com',
    'https://carshop-frontend-r48i.onrender.com',
    'https://car-shop-rosy.vercel.app',
    'https://car-shop-git-main-your-username.vercel.app',
    'https://car-shop.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
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

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 15 // 15 minutes
    }
}));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const carRoutes = require('./routes/cars');
const brandRoutes = require('./routes/brands');
const statisticsRoutes = require('./routes/statistics');
const authRoutes = require('./routes/auth');
const { handleMulterError, handleGenericErrors } = require('./middleware/errorHandlers');

// Register routes
app.use('/api/cars', carRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('Car Shop API is running');
});

// Error handling middleware
app.use(handleMulterError);
app.use(handleGenericErrors);

// Connect to database and start server
sequelize.authenticate()
  .then(() => {
    server.listen(port, () => {
      console.log(`Database connected successfully and app listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error.message);
  });
