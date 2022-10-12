import { MigrationInterface, QueryRunner } from 'typeorm'

export class dropHoldersTable1655825711293 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "holder_entity"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "holder_entity" ("id" character varying NOT NULL, "ethereumAddress" character varying NOT NULL, "currencyEthereumAddress" character varying NOT NULL, "currencyChainName" character varying NOT NULL, "balance" character varying NOT NULL, CONSTRAINT "PK_13ac6dcc71c9c315ca9e8fc6c1d" PRIMARY KEY ("id"))`,
    )
  }
}
