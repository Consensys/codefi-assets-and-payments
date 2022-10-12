import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSecuritiesTable1590618755495 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "public"."securities" (
            "securityId" uuid NOT NULL,
            "name" varchar(255),
            "symbol" varchar(255),
            "contractType" varchar(255),
            "abi" varchar(255),
            "processesIds" json,
            "defaultContractAddress" varchar(255),
            "defaultChainId" varchar(255),
            "deployments" _json,
            "picture" varchar(255),
            "description" varchar(255),
            "bankDepositDetail" json,
            "assetClasses" _varchar,
            "data" json,
            "createdAt" timestamptz NOT NULL,
            "updatedAt" timestamptz NOT NULL,
            PRIMARY KEY ("securityId")
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "securities"');
  }
}
