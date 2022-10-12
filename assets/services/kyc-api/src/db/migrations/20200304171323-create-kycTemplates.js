'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('kycTemplates', {
      templateId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      issuerId: {
        type: Sequelize.STRING,
      },
      name: {
        type: Sequelize.STRING,
      },
      topSections: {
        type: Sequelize.ARRAY(Sequelize.JSON),
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
    return queryInterface.dropTable('kycTemplates');
  },
};
