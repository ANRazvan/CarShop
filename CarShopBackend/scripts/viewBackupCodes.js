/**
 * Script to view backup codes for a user (for admin/recovery purposes)
 */
require('dotenv').config();
const { User } = require('../models');

async function viewBackupCodes(username) {
  try {
    const user = await User.findOne({ 
      where: { username },
      attributes: ['id', 'username', 'email', 'twoFactorEnabled', 'backupCodes']
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    if (!user.twoFactorEnabled) {
      console.log('❌ 2FA is not enabled for this user');
      return;
    }

    if (!user.backupCodes) {
      console.log('❌ No backup codes found for this user');
      return;
    }

    const backupCodes = JSON.parse(user.backupCodes);
    
    console.log(`\n=== Backup Codes for ${username} ===`);
    console.log(`User ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Remaining backup codes: ${backupCodes.length}\n`);
    
    backupCodes.forEach((code, index) => {
      console.log(`${index + 1}. ${code}`);
    });
    
    console.log('\n⚠️  Store these codes in a secure location!');
    console.log('⚠️  Each code can only be used once.');
    
  } catch (error) {
    console.error('Error retrieving backup codes:', error);
  }
}

// Check if username provided as argument
const username = process.argv[2];
if (!username) {
  console.log('Usage: node viewBackupCodes.js <username>');
  console.log('Example: node viewBackupCodes.js admin');
  process.exit(1);
}

viewBackupCodes(username).then(() => {
  process.exit(0);
});
