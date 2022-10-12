import { MigrationInterface, QueryRunner } from 'typeorm'

export class alterAddEntityIdColumn1632838362601 implements MigrationInterface {
  name = 'alterAddEntityIdColumn1632838362601'

  public async up(queryRunner: QueryRunner): Promise<void> {
    //OperationEntity
    await queryRunner.query(
      `ALTER TABLE "operation_entity" ADD COLUMN IF NOT EXISTS "entityId" character varying`,
    )
    //DigitalCurrencyEntity
    await queryRunner.query(
      `ALTER TABLE "digital_currency_entity" ADD "entityId" character varying`,
    )
    //LegalEntityEntity
    await queryRunner.query(
      `ALTER TABLE "legal_entity_entity" ADD "wallets" text[]`,
    )
    await queryRunner.query(
      `ALTER TABLE "legal_entity_entity" ADD "createdBy" character varying`,
    )
    await queryRunner.query(
      `ALTER TABLE "legal_entity_entity" ADD "createdAt" TIMESTAMP`,
    )
    await queryRunner.query(
      `ALTER TABLE "legal_entity_entity" ADD "metadata" json`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    //OperationEntity
    await queryRunner.query(
      `ALTER TABLE "operation_entity" DROP COLUMN "entityId"`,
    )
    //DigitalCurrencyEntity
    await queryRunner.query(
      `ALTER TABLE "digital_currency_entity" DROP COLUMN "entityId"`,
    )
    //LegalEntityEntity
    await queryRunner.query(
      `ALTER TABLE "legal_entity_entity" DROP COLUMN "wallets"`,
    )
    await queryRunner.query(
      `ALTER TABLE "legal_entity_entity" DROP COLUMN "createdBy"`,
    )
    await queryRunner.query(
      `ALTER TABLE "legal_entity_entity" DROP COLUMN "createdAt"`,
    )
    await queryRunner.query(
      `ALTER TABLE "legal_entity_entity" DROP COLUMN "metadata"`,
    )
  }
}
