import { MigrationInterface, QueryRunner } from 'typeorm'

export class alterLegalEntityWallets1634114145288
  implements MigrationInterface
{
  name = 'alterLegalEntityWallets1634114145288'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "public"."legal_entity_entity" DROP COLUMN "wallets"`,
    )
    await queryRunner.query(
      `ALTER TABLE "public"."legal_entity_entity" ADD "wallets" jsonb`,
    )
    await queryRunner.query(
      `ALTER TABLE "public"."legal_entity_entity" DROP COLUMN "metadata"`,
    )
    await queryRunner.query(
      `ALTER TABLE "public"."legal_entity_entity" ADD "metadata" jsonb`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "public"."legal_entity_entity" DROP COLUMN "metadata"`,
    )
    await queryRunner.query(
      `ALTER TABLE "public"."legaltype_entity_entity" ADD "metadata" json`,
    )
    await queryRunner.query(
      `ALTER TABLE "public"."legal_entity_entity" DROP COLUMN "wallets"`,
    )
    await queryRunner.query(
      `ALTER TABLE "public"."legal_entity_entity" ADD "wallets" text array`,
    )
  }
}
