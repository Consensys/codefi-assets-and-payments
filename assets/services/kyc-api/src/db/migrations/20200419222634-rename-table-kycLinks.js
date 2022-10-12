'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.renameTable('kycLinks', 'reviews');
  },

  down: (queryInterface, Sequelize) => {},
};
