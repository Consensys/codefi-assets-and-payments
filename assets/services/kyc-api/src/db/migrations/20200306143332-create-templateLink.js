'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('templateLinks', {
      templateLinkId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      templateId: {
        type: Sequelize.STRING,
      },
      userId: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.ENUM('SUBMITTED', 'VALIDATED', 'REJECTED'),
      },
      rejectReason: {
        type: Sequelize.STRING,
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
    return queryInterface.dropTable('templateLinks');
  },
};
