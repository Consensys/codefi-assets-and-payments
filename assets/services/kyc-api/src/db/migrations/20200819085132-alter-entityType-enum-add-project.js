'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(
      `
        ALTER TABLE reviews
        ALTER COLUMN "entityType" TYPE VARCHAR(255);
        DROP TYPE IF EXISTS "enum_reviews_entityType" CASCADE;
        CREATE TYPE "enum_reviews_entityType" AS ENUM ('TOKEN', 'ASSET_CLASS', 'ISSUER', 'ADMIN', 'PROJECT');
        ALTER TABLE reviews
        ALTER COLUMN "entityType" TYPE "enum_reviews_entityType" USING ("entityType"::text::public."enum_reviews_entityType");
      `,
    );
  },

  down: (queryInterface, Sequelize) => {},
};
