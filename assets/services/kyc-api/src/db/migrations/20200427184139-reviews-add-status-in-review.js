'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(
      `ALTER TYPE "enum_kycLinks_status" ADD VALUE 'IN_REVIEW'`,
    );
  },

  down: (queryInterface, Sequelize) => {},
};
