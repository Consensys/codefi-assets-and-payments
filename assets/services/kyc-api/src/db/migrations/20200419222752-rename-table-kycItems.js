'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.renameTable('kycItems', 'elements');
  },

  down: (queryInterface, Sequelize) => {},
};
