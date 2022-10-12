'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.renameTable('kycTemplates', 'templates');
  },

  down: (queryInterface, Sequelize) => {},
};
