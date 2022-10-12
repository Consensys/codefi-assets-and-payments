'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.dropTable('templateLinks');
  },

  down: (queryInterface, Sequelize) => {},
};
