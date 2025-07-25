'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'twoFactorSecret', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Users', 'twoFactorEnabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    
    await queryInterface.addColumn('Users', 'backupCodes', {
      type: Sequelize.JSON,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'twoFactorSecret');
    await queryInterface.removeColumn('Users', 'twoFactorEnabled');
    await queryInterface.removeColumn('Users', 'backupCodes');
  }
};
