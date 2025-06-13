const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
    allowNull: false
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  twoFactorSecret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  backupCodes: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  tableName: 'Users', // Specify the exact table name with capitalization
  timestamps: true
});

// Add instance method for password validation
User.prototype.validatePassword = async function(password) {
  try {
    if (!password) {
      console.error('Password validation error: No password provided');
      return false;
    }
    if (!this.password) {
      console.error('Password validation error: User has no stored password');
      return false;
    }
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error('Password validation error:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return false;  }
};

// Define associations
User.associate = function(models) {
  // User has many Logs
  User.hasMany(models.UserLog, {
    foreignKey: 'userId',
    as: 'logs'
  });
  
  // User has many monitored entries
  User.hasMany(models.MonitoredUser, {
    foreignKey: 'userId',
    as: 'monitoringEvents'
  });
  
  // User has many Cars (owned cars)
  User.hasMany(models.Car, {
    foreignKey: 'userId',
    as: 'ownedCars'
  });

  // User has many Carts
  User.hasMany(models.Cart, {
    foreignKey: 'userId',
    as: 'carts'
  });

  // User has many Orders
  User.hasMany(models.Order, {
    foreignKey: 'userId',
    as: 'orders'
  });
};

    return User;
};
