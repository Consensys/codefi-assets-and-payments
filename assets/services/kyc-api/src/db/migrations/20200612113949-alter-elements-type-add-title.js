'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(
      `
        ALTER TYPE "enum_kycItems_type" ADD VALUE 'title';
      `,
    );
  },

  down: (queryInterface, Sequelize) => {},
};
