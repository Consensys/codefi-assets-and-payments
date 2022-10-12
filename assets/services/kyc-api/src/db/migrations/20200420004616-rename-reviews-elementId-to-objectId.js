'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.renameColumn('reviews', 'elementId', 'objectId');
  },

  down: (queryInterface, Sequelize) => {},
};
