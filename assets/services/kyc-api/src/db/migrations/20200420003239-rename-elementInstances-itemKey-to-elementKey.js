'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.renameColumn(
      'elementInstances',
      'itemKey',
      'elementKey',
    );
  },

  down: (queryInterface, Sequelize) => {},
};
