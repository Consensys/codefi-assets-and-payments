'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('kycItems', {
      itemId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      key: {
        type: Sequelize.STRING,
      },
      type: {
        type: Sequelize.ENUM(
          'string',
          'number',
          'check',
          'radio',
          'document',
          'multistring',
        ),
      },
      status: {
        type: Sequelize.ENUM('mandatory', 'optional', 'conditional'),
      },
      label: {
        type: Sequelize.JSON,
      },
      placeholder: {
        type: Sequelize.JSON,
      },
      inputs: {
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
    return queryInterface.dropTable('kycItems');
  },
};
