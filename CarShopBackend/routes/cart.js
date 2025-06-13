const express = require('express');
const router = express.Router();
const { auth, logAction } = require('../middleware/authMiddleware');
const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  getCartCount
} = require('../controllers/cartController');

// All cart routes require authentication
router.use(auth);

// GET user's cart
router.get('/', logAction('VIEW', 'CART'), getCart);

// GET cart item count (for navbar badge)
router.get('/count', getCartCount);

// POST add item to cart
router.post('/items', logAction('ADD', 'CART_ITEM'), addToCart);

// DELETE remove item from cart
router.delete('/items/:carId', logAction('REMOVE', 'CART_ITEM'), removeFromCart);

// DELETE clear entire cart
router.delete('/clear', logAction('CLEAR', 'CART'), clearCart);

module.exports = router;
