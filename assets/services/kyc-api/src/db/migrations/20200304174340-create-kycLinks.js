'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('kycLinks', {
      linkId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      elementId: {
        type: Sequelize.STRING,
      },
      issuerId: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.ENUM('SUBMITTED', 'VALIDATED', 'REJECTED'),
      },
      data: {
        type: Sequelize.JSON,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('kycLinks');
  },
};
