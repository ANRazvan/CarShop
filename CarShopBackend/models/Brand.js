// File: models/Brand.js
module.exports = (sequelize, DataTypes) => {
    const Brand = sequelize.define('Brand', {
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

    // Define associations
    Brand.associate = function(models) {
        // One Brand has many Cars
        Brand.hasMany(models.Car, { 
            foreignKey: 'brandId',
            as: 'cars',
            onDelete: 'CASCADE'
        });
    };

    return Brand;
};