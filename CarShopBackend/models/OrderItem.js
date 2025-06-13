const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Orders',
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
      comment: 'Price at the time of order'
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    }
  }, {
    tableName: 'OrderItems',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['orderId', 'carId']
      }
    ]
  });

  OrderItem.associate = function(models) {
    // OrderItem belongs to an Order
    OrderItem.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });
    
    // OrderItem belongs to a Car
    OrderItem.belongsTo(models.Car, {
      foreignKey: 'carId',
      as: 'car'
    });
  };

  return OrderItem;
};
