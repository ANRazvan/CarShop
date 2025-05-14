const express = require('express');
const monitoringController = require('../controllers/monitoringController');
const simulationController = require('../controllers/simulationController');
const { auth, adminOnly, logAction } = require('../middleware/authMiddleware');
const router = express.Router();

// All routes require authentication
router.use(auth);

// Admin only routes
router.get('/monitored', adminOnly, logAction('VIEW', 'MONITORED_USERS'), monitoringController.getMonitoredUsers);
router.get('/stats', adminOnly, logAction('VIEW', 'USER_STATS'), monitoringController.getUserActivityStats);
router.patch('/monitored/:id', adminOnly, logAction('UPDATE', 'MONITORED_USER'), monitoringController.updateMonitoredUserStatus);
router.post('/simulate', adminOnly, logAction('SIMULATE', 'USER_ACTIVITY'), simulationController.simulateActivity);

// User can view their own logs, admin can view anyone's logs
router.get('/logs/:userId', logAction('VIEW', 'USER_LOGS'), monitoringController.getUserLogs);

module.exports = router;
