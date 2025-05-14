// Create an admin user
const { sequelize } = require('../config/pgdb');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createAdminUser(username, email, password) {
  try {
    console.log('Creating admin user...');
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        username
      }
    });
    
    if (existingUser) {
      console.log('User already exists. Updating to admin role...');
      existingUser.role = 'admin';
      await existingUser.save();
      console.log(`User ${username} updated to admin role successfully.`);
      return existingUser;
    }
    
    // Create new admin user
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by User model hooks
      role: 'admin'
    });
    
    console.log(`Admin user ${username} created successfully.`);
    return user;
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await sequelize.close();
  }
}

// Configuration - change these values
const adminUsername = 'admin';
const adminEmail = 'admin@example.com';
const adminPassword = 'Admin123!';

// Run the function
createAdminUser(adminUsername, adminEmail, adminPassword)
  .then(() => {
    console.log('Admin user creation process completed.');
  })
  .catch(err => {
    console.error('Failed to create admin user:', err);
  });
