// Create an admin user with fixed credentials
const { sequelize } = require('../config/pgdb');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createFixedAdminUser() {
  try {
    // Fixed admin credentials
    const adminUsername = 'admin';
    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin123!'; 
    
    console.log('Creating admin user with fixed credentials...');
    console.log(`Username: ${adminUsername}`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: {
        username: adminUsername
      }
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists. Ensuring it has admin role...');
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('Admin user role confirmed.');
      return;
    }
    
    // Hash password manually (not relying on hooks)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    // Create admin user
    const admin = await User.create({
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });
    
    console.log('Admin user created successfully!');
    console.log(`ID: ${admin.id}`);
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run the function
createFixedAdminUser();
