import { MigrationInterface, QueryRunner } from 'typeorm'

export class initial1620831231966 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "digital_currency_entity_status_enum" AS ENUM('pending', 'confirmed', 'failed')`,
    )
    await queryRunner.query(
      `CREATE TABLE "digital_currency_entity" ("id" character varying NOT NULL, "name" character varying NOT NULL, "symbol" character varying NOT NULL, "decimals" integer NOT NULL, "deployerAddress" character varying NOT NULL, "chainName" character varying NOT NULL, "totalMinted" character varying NOT NULL, "totalBurnt" character varying NOT NULL, "currencyEthereumAddress" character varying, "operationId" character varying, "createdBy" character varying, "tenantId" character varying, "createdAt" TIMESTAMP, "status" "digital_currency_entity_status_enum" NOT NULL, CONSTRAINT "PK_3f4bb766947f68282cca075fb4f" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "holder_entity" ("id" character varying NOT NULL, "ethereumAddress" character varying NOT NULL, "currencyEthereumAddress" character varying NOT NULL, "currencyChainName" character varying NOT NULL, "balance" character varying NOT NULL, CONSTRAINT "PK_13ac6dcc71c9c315ca9e8fc6c1d" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "legal_entity_entity" ("id" character varying NOT NULL, "legalEntityName" character varying NOT NULL, "ethereumAddress" character varying NOT NULL, "orchestrateChainName" character varying NOT NULL, "status" character varying NOT NULL, CONSTRAINT "PK_355f0123bb253b1dcaf1e066021" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TYPE "operation_entity_status_enum" AS ENUM('pending', 'confirmed', 'failed')`,
    )
    await queryRunner.query(
      `CREATE TYPE "operation_entity_operationtype_enum" AS ENUM('creation', 'transfer', 'mint', 'burn')`,
    )
    await queryRunner.query(
      `CREATE TABLE "operation_entity" ("id" character varying NOT NULL, "status" "operation_entity_status_enum" NOT NULL, "operationType" "operation_entity_operationtype_enum" NOT NULL, "digitalCurrencyAddress" character varying, "chainName" character varying NOT NULL, "operationAmount" character varying NOT NULL, "tenantId" character varying, "entityId" character varying, "createdBy" character varying, "operationTriggeredByAddress" character varying NOT NULL, "operationTargetAddress" character varying, "operationSourceAddress" character varying, "createdAt" TIMESTAMP, "transactionHash" character varying, CONSTRAINT "PK_926dbec3380e83643b464d67817" PRIMARY KEY ("id"))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "operation_entity"`)
    await queryRunner.query(`DROP TYPE "operation_entity_operationtype_enum"`)
    await queryRunner.query(`DROP TYPE "operation_entity_status_enum"`)
    await queryRunner.query(`DROP TABLE "legal_entity_entity"`)
    await queryRunner.query(`DROP TABLE "holder_entity"`)
    await queryRunner.query(`DROP TABLE "digital_currency_entity"`)
    await queryRunner.query(`DROP TYPE "digital_currency_entity_status_enum"`)
  }
}
