const { DataTypes } = require('sequelize');
const getConnection = require('../config/supabase-db');

async function initBrandModel() {
  const sequelize = await getConnection();

  return sequelize.define('Brand', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    country: {
      type: DataTypes.STRING
    },
    foundedYear: {
      type: DataTypes.INTEGER
    },
    logo: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.TEXT
    }
  }, {
    timestamps: true
  });
}

module.exports = initBrandModel;
