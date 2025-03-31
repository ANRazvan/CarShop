require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const carRoutes = require('./routes/cars');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/cars', carRoutes);

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
