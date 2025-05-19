// Routes for statistics endpoints
const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const indexController = require('../controllers/indexController');

// Route to get complex statistical data with optimized queries
router.get('/cars', statisticsController.getCarStatistics);

// Route to get trending data
router.get('/trending', statisticsController.getTrendingData);

// Routes for index management
router.get('/indices', indexController.getIndicesStatus);
router.post('/indices/toggle', indexController.toggleIndices);

module.exports = router;