'use strict';

module.exports = {
  up: async queryInterface => {
    try {
      await queryInterface.addIndex('elementInstances', ['tenantId'], {
        name: 'IX_elementInstances_tenantId',
      });
      await queryInterface.addIndex('elements', ['tenantId'], {
        name: 'IX_elements_tenantId',
      });
      await queryInterface.addIndex('reviews', ['tenantId'], {
        name: 'IX_reviews_tenantId',
      });
      await queryInterface.addIndex('templates', ['tenantId'], {
        name: 'IX_templates_tenantId',
      });
      await queryInterface.addIndex('templates', ['tenantId', 'id'], {
        name: 'UX_templates_tenantId_id',
      });
    } catch (e) {
      return Promise.reject(e);
    }
  },

  down: async queryInterface => {
    try {
      await queryInterface.removeIndex(
        'elementInstances',
        'IX_elementInstances_tenantId',
      );
      await queryInterface.removeIndex('elements', 'IX_elements_tenantId');
      await queryInterface.removeIndex('reviews', 'IX_reviews_tenantId');
      await queryInterface.removeIndex('templates', 'IX_templates_tenantId');
      await queryInterface.removeIndex(
        'templates',
        'UX_elementInstances_tenantId_id',
      );
    } catch (e) {
      return Promise.reject(e);
    }
  },
};
