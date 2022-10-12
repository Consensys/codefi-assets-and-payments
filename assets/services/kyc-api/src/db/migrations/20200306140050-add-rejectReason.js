'use strict';

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('kycLinks', 'rejectReason', {
      type: Sequelize.STRING,
    }),
  down: (queryInterface) =>
    queryInterface.removeColumn('kycLinks', 'rejectReason'),
};
