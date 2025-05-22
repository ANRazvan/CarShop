const { DataTypes } = require('sequelize');
const getConnection = require('../config/database');

let Car = null;
/*

  // models/User.js

  const { DataTypes } = require('sequelize');
  const sequelize = require('../config/database'); // Import the Sequelize configuration

  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  });

  module.exports = User;

*/

async function initCarModel() {
    const sequelize = await getConnection();
    
    Car = sequelize.define('Car', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        make: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        model: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    }, {
        tableName: 'cars',
        timestamps: false,
    });
    
    return Car;
}

module.exports = {
    initCarModel,
    getCar: () => Car
};
