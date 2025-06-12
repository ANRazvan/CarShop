module.exports = (sequelize, DataTypes) => {
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
}, {
    tableName: 'MonitoredUsers', // Specify the exact table name with capitalization
    timestamps: true
});

    // Define associations
    MonitoredUser.associate = function(models) {
      // Monitored entry belongs to a User
      MonitoredUser.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    };

    return MonitoredUser;
};
