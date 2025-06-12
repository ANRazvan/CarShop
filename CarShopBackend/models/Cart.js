const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cart = sequelize.define('Cart', {
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
    total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'checkout', 'completed', 'abandoned'),
      defaultValue: 'active',
      allowNull: false
    }
  }, {
    tableName: 'Carts',
    timestamps: true
  });

  Cart.associate = function(models) {
    // Cart belongs to a User
    Cart.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    // Cart has many CartItems
    Cart.hasMany(models.CartItem, {
      foreignKey: 'cartId',
      as: 'items',
      onDelete: 'CASCADE'
    });
  };

  return Cart;
};
