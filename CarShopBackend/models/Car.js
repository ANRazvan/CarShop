const { DataTypes } = require('sequelize');
const getConnection = require('../config/supabase-db');

async function defineCarModel() {
  const sequelize = await getConnection();
  
  return sequelize.define('Car', {
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
}

module.exports = defineCarModel;
