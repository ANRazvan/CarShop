const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CartItem = sequelize.define('CartItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cartId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Carts',
        key: 'id'
      }
    },
    carId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Cars',
        key: 'id'
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Price at the time of adding to cart'
    },
    addedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  }, {
    tableName: 'CartItems',
    timestamps: true,
    indexes: [
      // Ensure one car can only be in a cart once
      {
        unique: true,
        fields: ['cartId', 'carId']
      }
    ]
  });

  CartItem.associate = function(models) {
    // CartItem belongs to a Cart
    CartItem.belongsTo(models.Cart, {
      foreignKey: 'cartId',
      as: 'cart'
    });
    
    // CartItem belongs to a Car
    CartItem.belongsTo(models.Car, {
      foreignKey: 'carId',
      as: 'car'
    });
  };

  return CartItem;
};
