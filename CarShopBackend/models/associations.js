// filepath: CarShopBackend/models/associations.js
const Brand = require('./Brand');
const Car = require('./Car');
const User = require('./User');
const UserLog = require('./UserLog');
const MonitoredUser = require('./MonitoredUser');

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

  // User has many Logs
  User.hasMany(UserLog, {
    foreignKey: 'userId',
    as: 'logs'
  });
  
  // Log belongs to a User
  UserLog.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // User has many monitored entries
  User.hasMany(MonitoredUser, {
    foreignKey: 'userId',
    as: 'monitoringEvents'
  });
  
  // Monitored entry belongs to a User
  MonitoredUser.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
  // Add ownership relationship for User to Cars
  User.hasMany(Car, {
    foreignKey: 'userId',
    as: 'cars'
  });
    // Car belongs to a User
  Car.belongsTo(User, {
    foreignKey: 'userId',
    as: 'owner'
  });
  
  Car.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = setupAssociations;