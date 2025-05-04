// filepath: CarShopBackend/models/Car.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/pgdb');

const Car = sequelize.define('Car', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  make: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  model: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  year: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  keywords: { 
    type: DataTypes.STRING 
  },
  description: { 
    type: DataTypes.TEXT 
  },
  fuelType: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  price: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  },
  img: { 
    type: DataTypes.STRING 
  }
}, {
  timestamps: true
});

module.exports = Car;