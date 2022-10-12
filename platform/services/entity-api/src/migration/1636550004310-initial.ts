import { MigrationInterface, QueryRunner } from 'typeorm'

export class initial1636550004310 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "wallets_type_enum" AS ENUM('orchestrate', 'external')`,
    )
    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" character varying NOT NULL, "name" character varying NOT NULL, "defaultNetworkKey" character varying NOT NULL, "products" jsonb NOT NULL, "metadata" jsonb NOT NULL, "initialAdmins" jsonb NOT NULL, "createdBy" character varying NOT NULL, "createdAt" timestamp without time zone NOT NULL DEFAULT now(), "updatedAt" timestamp without time zone NOT NULL DEFAULT now(), "deletedDate" timestamp without time zone, CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "entities" ("id" character varying NOT NULL, "tenantId" character varying NOT NULL, "name" character varying NOT NULL, "metadata" jsonb NOT NULL, "defaultWallet" character varying NOT NULL, "initialAdmins" jsonb NOT NULL, "createdBy" character varying NOT NULL, "createdAt" timestamp without time zone NOT NULL DEFAULT now(), "updatedAt" timestamp without time zone NOT NULL DEFAULT now(), "deletedDate" timestamp without time zone, CONSTRAINT "PK_8640855ae82083455cbb806173d" PRIMARY KEY ("id"), CONSTRAINT "FK_f2a83581b0124bca6377aace67a" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION)`,
    )
    await queryRunner.query(
      `CREATE TABLE "wallets" ("address" character varying NOT NULL, "entityId" character varying NOT NULL, "type" wallets_type_enum NOT NULL, "metadata" jsonb NOT NULL, "createdBy" character varying NOT NULL, "createdAt" timestamp without time zone NOT NULL DEFAULT now(), "updatedAt" timestamp without time zone NOT NULL DEFAULT now(), "deletedDate" timestamp without time zone, CONSTRAINT "PK_f907d5fd09a9d374f1da4e13bd3" PRIMARY KEY ("address"), CONSTRAINT "FK_bf790709aca14024be32b7c6486" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION)`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "wallets"`)
    await queryRunner.query(`DROP TABLE "entities"`)
    await queryRunner.query(`DROP TABLE "tenants"`)
    await queryRunner.query(`DROP TYPE "wallets_type_enum"`)
  }
}
