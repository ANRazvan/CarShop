// filepath: CarShopBackend/models/Car.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/supabase-db'); // Make sure this exports a Sequelize instance!

const Car = sequelize.define('Car', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  make: { 
    type: DataTypes.STRING,
    allowNull: true
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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  price: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  },
  img: { 
    type: DataTypes.TEXT('long'),
    comment: 'Base64 encoded image data'
  },
  imgType: {
    type: DataTypes.STRING,
    defaultValue: 'image/jpeg'
  },
  brandId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Brands',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

module.exports = Car;
