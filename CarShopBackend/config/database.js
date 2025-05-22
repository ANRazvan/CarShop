  // config/database.js

  const { Sequelize } = require('sequelize');

  const sequelize = new Sequelize('postgres','carshopdatabase','postgres',{
    dialect: 'postgres',
    host: 'db.rjlewidauwbneruxdspn.supabase.co',
  });

  module.exports = sequelize;
