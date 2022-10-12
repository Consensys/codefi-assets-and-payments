'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.renameTable('kycElements', 'elementInstances');
  },

  down: (queryInterface, Sequelize) => {},
};
