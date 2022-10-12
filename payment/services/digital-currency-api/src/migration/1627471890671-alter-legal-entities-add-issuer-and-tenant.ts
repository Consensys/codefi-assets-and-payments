import { MigrationInterface, QueryRunner } from 'typeorm'

export class alterLegalEntitiesAddIssuerAndTenant1627471890671
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE legal_entity_entity ADD COLUMN "issuer" BOOLEAN NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE legal_entity_entity ADD COLUMN "tenantId" character varying NOT NULL`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE legal_entity_entity DROP COLUMN "issuer"`,
    )
    await queryRunner.query(
      `ALTER TABLE legal_entity_entity DROP COLUMN "tenantId"`,
    )
  }
}
