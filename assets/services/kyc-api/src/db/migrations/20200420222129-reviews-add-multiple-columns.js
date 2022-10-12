'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('reviews', 'scope', {
        type: Sequelize.ENUM('TEMPLATE', 'SECTION', 'ELEMENT_INSTANCE'),
        allowNull: false,
        defaultValue: 'ELEMENT_INSTANCE',
      });
      await queryInterface.addColumn('reviews', 'sectionKey', {
        type: Sequelize.STRING,
      });
      await queryInterface.addColumn('reviews', 'investorId', {
        type: Sequelize.STRING,
      });
      await queryInterface.addColumn('reviews', 'entityType', {
        type: Sequelize.ENUM('TOKEN', 'USER'),
        allowNull: false,
        defaultValue: 'TOKEN',
      });
      await queryInterface.addColumn('reviews', 'category', {
        type: Sequelize.ENUM(
          'ELIGIBLE_COUNTER_PARTIES',
          'PROFESSIONAL_CLIENTS',
          'RETAIL_CUSTOMERS',
        ),
      });
      await queryInterface.addColumn('reviews', 'riskProfile', {
        type: Sequelize.ENUM(
          'CONSERVATIVE',
          'MODERATE',
          'BALANCED',
          'DYNAMIC',
          'AGGRESSIVE',
        ),
      });
      await queryInterface.addColumn('reviews', 'validityDate', {
        type: Sequelize.DATE,
      });
    } catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('reviews', 'scope');
    await queryInterface.removeColumn('reviews', 'sectionKey');
    await queryInterface.removeColumn('reviews', 'investorId');
    await queryInterface.removeColumn('reviews', 'entityType');
    await queryInterface.removeColumn('reviews', 'category');
    await queryInterface.removeColumn('reviews', 'riskProfile');
    await queryInterface.removeColumn('reviews', 'validityDate');
  },
};
