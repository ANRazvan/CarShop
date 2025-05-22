  // config/database.js

  const { Sequelize } = require('sequelize');

  const sequelize = new Sequelize('postgres','carshopdatabase','postgres',{
    dialect: 'postgres',
    host: 'db.rjlewidauwbneruxdspn.supabase.co',
  });

  module.exports = sequelize;

DATABASE_URL=postgresql://postgres:carshopdatabase@db.rjlewidauwbneruxdspn.supabase.co:5432/postgres

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# PostgreSQL Configuration (for fallback/local development)
PG_HOST=db.rjlewidauwbneruxdspn.supabase.co
PG_USER=postgres
PG_PASSWORD=carshopdatabase
PG_DATABASE=postgres
PG_PORT=5432