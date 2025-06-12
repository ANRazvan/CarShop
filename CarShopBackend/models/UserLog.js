module.exports = (sequelize, DataTypes) => {
    const UserLog = sequelize.define('UserLog', {
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
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
    tableName: 'UserLogs', // Specify the exact table name with capitalization
    timestamps: true
    });

    // Define associations
    UserLog.associate = function(models) {
      // Log belongs to a User
      UserLog.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    };

    return UserLog;
};
