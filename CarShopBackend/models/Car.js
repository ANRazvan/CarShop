const { DataTypes } = require('sequelize');
const getConnection = require('../config/supabase-db');

let Car = null;

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
