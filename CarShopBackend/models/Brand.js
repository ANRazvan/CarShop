// File: models/Brand.js
const { DataTypes } = require('sequelize');
const  sequelize  = require('../config/database');

Brand = sequelize.define('Brand', {
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
    tableName: 'Brands', // Specify the exact table name with capitalization
    timestamps: true
});


module.exports = Brand;