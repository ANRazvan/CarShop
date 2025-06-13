const express = require('express');
const router = express.Router();
const { auth, logAction } = require('../middleware/authMiddleware');
const {
  getUserOrders,
  getOrderById,
  checkout,
  getAllOrders,
  updateOrderStatus,
  getOrdersWithUserCars,
  getOrderStatistics
} = require('../controllers/orderController');

// All order routes require authentication
router.use(auth);

// User order routes
router.get('/', logAction('VIEW', 'ORDER'), getUserOrders);
router.get('/statistics', logAction('VIEW', 'ORDER_STATS'), getOrderStatistics);
router.get('/my-car-orders', logAction('VIEW', 'MY_CAR_ORDERS'), getOrdersWithUserCars);
router.get('/:id', logAction('VIEW', 'ORDER'), getOrderById);

// Checkout route
router.post('/checkout', logAction('CREATE', 'ORDER'), checkout);

// Admin routes
router.get('/admin/all', logAction('VIEW', 'ALL_ORDERS'), getAllOrders);
router.put('/:id/status', logAction('UPDATE', 'ORDER_STATUS'), updateOrderStatus);

module.exports = router;
