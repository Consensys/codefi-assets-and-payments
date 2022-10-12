'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.renameColumn('elementInstances', 'elementId', 'id');
  },

  down: (queryInterface, Sequelize) => {},
};
