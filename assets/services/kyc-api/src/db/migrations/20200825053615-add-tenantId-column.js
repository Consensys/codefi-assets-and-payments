'use strict';

const {
  DEFAULT_TENANT_ID,
  DEFAULT_INITIALIZATION_TENANT_ID,
} = require('../../utils/constants/constants');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('elements', 'tenantId', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: DEFAULT_TENANT_ID,
      });
      await queryInterface.addColumn('templates', 'tenantId', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: DEFAULT_TENANT_ID,
      });
      await queryInterface.addColumn('elementInstances', 'tenantId', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: DEFAULT_INITIALIZATION_TENANT_ID,
      });
      await queryInterface.addColumn('reviews', 'tenantId', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: DEFAULT_INITIALIZATION_TENANT_ID,
      });
    } catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('elements', 'tenantId');
      await queryInterface.removeColumn('templates', 'tenantId');
      await queryInterface.removeColumn('elementInstances', 'tenantId');
      await queryInterface.removeColumn('reviews', 'tenantId');
    } catch (e) {
      return Promise.reject(e);
    }
  },
};
