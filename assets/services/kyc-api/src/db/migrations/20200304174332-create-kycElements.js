'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('kycElements', {
      elementId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      itemKey: {
        type: Sequelize.STRING,
      },
      userId: {
        type: Sequelize.STRING,
      },
      value: {
        type: Sequelize.ARRAY(Sequelize.STRING),
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
    return queryInterface.dropTable('kycElements');
  },
};
