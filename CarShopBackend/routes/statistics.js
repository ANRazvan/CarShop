// Routes for statistics endpoints
const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');

// Route to get complex statistical data with optimized queries
router.get('/cars', statisticsController.getCarStatistics);

// Route to get trending data
router.get('/trending', statisticsController.getTrendingData);

module.exports = router;