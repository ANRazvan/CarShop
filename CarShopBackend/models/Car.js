const { DataTypes } = require('sequelize');
const  sequelize  = require('../config/database');


const Car = sequelize.define('Car', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  make: { 
    type: DataTypes.STRING,
    allowNull: true  // Make this optional so both old and new records work
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
    type: DataTypes.TEXT('long'),  // Change to TEXT type to store Base64 encoded image
    comment: 'Base64 encoded image data'
  },  imgType: {
    type: DataTypes.STRING, // Store the MIME type (e.g. image/jpeg)
    defaultValue: 'image/jpeg'
  },
  brandId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Make this optional during migration
    references: {
      model: 'Brands', // Note Sequelize pluralizes table names
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for compatibility with existing data
    references: {
      model: 'Users', // Sequelize pluralizes table names
      key: 'id'
    }
  }
}, {
  tableName: 'Cars', // Specify the exact table name with capitalization
  timestamps: true
});

module.exports = Car;
