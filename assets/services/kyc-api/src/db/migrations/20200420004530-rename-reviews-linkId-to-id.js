'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.renameColumn('reviews', 'linkId', 'id');
  },

  down: (queryInterface, Sequelize) => {},
};
