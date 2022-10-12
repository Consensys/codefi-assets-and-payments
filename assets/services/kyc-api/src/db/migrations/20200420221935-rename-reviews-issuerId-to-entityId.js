'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.renameColumn('reviews', 'issuerId', 'entityId');
  },

  down: (queryInterface, Sequelize) => {},
};
