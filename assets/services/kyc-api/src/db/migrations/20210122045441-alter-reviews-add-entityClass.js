'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('reviews', 'entityClass', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    } catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('reviews', 'entityClass');
    } catch (e) {
      return Promise.reject(e);
    }
  }
};
