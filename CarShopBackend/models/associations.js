// filepath: CarShopBackend/models/associations.js
const Brand = require('./Brand');
const Car = require('./Car');

// Define associations
const setupAssociations = () => {
  // One Brand has many Cars
  Brand.hasMany(Car, { 
    foreignKey: 'brandId',
    as: 'cars',
    onDelete: 'CASCADE'
  });
  
  // Car belongs to one Brand
  Car.belongsTo(Brand, { 
    foreignKey: 'brandId',
    as: 'brand'
  });
};

module.exports = setupAssociations;