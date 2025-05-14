const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/pgdb');

const MonitoredUser = sequelize.define('MonitoredUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false
  },
  actionsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  timeWindow: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstDetected: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('active', 'resolved', 'false_positive'),
    defaultValue: 'active'
  }
});

module.exports = MonitoredUser;
