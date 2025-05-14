// Check for admin users
const { sequelize } = require('../config/pgdb');
const User = require('../models/User');

async function checkAdminUsers() {
  try {
    console.log('Checking for admin users...');
    
    const adminUsers = await User.findAll({
      where: {
        role: 'admin'
      },
      attributes: ['id', 'username', 'email', 'role', 'lastLogin', 'createdAt']
    });
    
    if (adminUsers.length === 0) {
      console.log('No admin users found in the database.');
    } else {
      console.log(`Found ${adminUsers.length} admin users:`);
      adminUsers.forEach(user => {
        console.log(JSON.stringify(user.get({ plain: true }), null, 2));
      });
    }
    
    console.log('\nChecking all users:');
    const allUsers = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'lastLogin', 'createdAt']
    });
    
    console.log(`Total users: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(JSON.stringify(user.get({ plain: true }), null, 2));
    });
    
  } catch (error) {
    console.error('Error checking admin users:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the function
checkAdminUsers();
