'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.renameColumn('templates', 'templateId', 'id');
  },

  down: (queryInterface, Sequelize) => {},
};
