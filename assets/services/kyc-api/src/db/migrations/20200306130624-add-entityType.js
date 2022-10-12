'use strict';

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('whitelists', 'entityType', {
      type: Sequelize.ENUM('TOKEN', 'USER'),
      allowNull: false,
      defaultValue: 'TOKEN',
    }),
  down: (queryInterface) =>
    queryInterface.removeColumn('whitelists', 'entityType'),
};
