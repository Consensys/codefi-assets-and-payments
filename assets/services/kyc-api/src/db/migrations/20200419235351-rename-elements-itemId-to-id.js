'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.renameColumn('elements', 'itemId', 'id');
  },

  down: (queryInterface, Sequelize) => {},
};
