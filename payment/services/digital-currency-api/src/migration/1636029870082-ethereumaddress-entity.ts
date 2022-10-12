import { MigrationInterface, QueryRunner } from 'typeorm'

export class ethereumaddressEntity1636029870082 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "ethereum_address_type_enum" AS ENUM('orchestrate', 'external')`,
    )
    await queryRunner.query(
      `CREATE TABLE "ethereum_address_entity" ("id" character varying NOT NULL, "entityId" character varying NOT NULL, "address" character varying NOT NULL, "metadata" character varying NOT NULL, "createdAt" TIMESTAMP, "type" ethereum_address_type_enum NOT NULL)`,
    )
    await queryRunner.query(
      `ALTER TABLE "public"."legal_entity_entity" DROP COLUMN "wallets"`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "public"."legal_entity_entity" ADD "wallets" jsonb`,
    )
    await queryRunner.query(`DROP TYPE "ethereum_address_type_enum`)
    await queryRunner.query(`DROP TABLE "ethereum_address_entity"`)
  }
}
