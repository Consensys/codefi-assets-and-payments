'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.renameColumn('reviews', 'rejectReason', 'comment');
  },

  down: (queryInterface, Sequelize) => {},
};
