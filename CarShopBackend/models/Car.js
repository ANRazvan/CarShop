const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


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
    tableName: 'Cars',
    timestamps: false,
});


module.exports = Car;
