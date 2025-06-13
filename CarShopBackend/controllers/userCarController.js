/**
 * This controller adds secure user-based operation handling to the car controller.
 * It extends the existing functionality with user ownership checks.
 */
const { Car } = require('../models');
const { Op } = require('sequelize');

// Get cars belonging to the current user
exports.getMyCars = async (req, res) => {
  try {
    const cars = await Car.findAll({
      where: {
        userId: req.user.id
      }
    });
    
    res.status(200).json(cars);
  } catch (error) {
    console.error('Error getting user cars:', error);
    res.status(500).json({ message: 'Error retrieving cars', error: error.message });
  }
};

// Check if a user owns a car or is admin
exports.checkCarOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const car = await Car.findByPk(id);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // Allow if user is admin or the car owner
    if (req.user.role === 'admin' || car.userId === req.user.id) {
      req.car = car; // Attach car to request for future use
      next();
    } else {
      res.status(403).json({ message: 'Forbidden: You do not own this car' });
    }
  } catch (error) {
    console.error('Error checking car ownership:', error);
    res.status(500).json({ message: 'Error checking ownership', error: error.message });
  }
};

// Assign current user as owner when creating a car
exports.assignCarOwner = (req, res, next) => {
  if (req.body) {
    req.body.userId = req.user.id;
  }
  next();
};

module.exports = exports;
