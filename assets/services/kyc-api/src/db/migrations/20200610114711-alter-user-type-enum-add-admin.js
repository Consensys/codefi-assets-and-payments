'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query(
        `
        ALTER TYPE "enum_reviews_entityType" RENAME VALUE 'USER' TO 'ISSUER';
        `,
      ),
      queryInterface.sequelize.query(
        `
        ALTER TYPE "enum_reviews_entityType" ADD VALUE 'ADMIN';
        `,
      ),
    ]);
  },

  down: (queryInterface, Sequelize) => {},
};
