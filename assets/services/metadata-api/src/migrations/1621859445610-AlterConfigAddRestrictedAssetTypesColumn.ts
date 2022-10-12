import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterConfigAddRestrictedAssetTypesColumn1621859445610
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE configs ADD COLUMN "restrictedAssetTypes" text[] NOT NULL DEFAULT \'{}\'',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE configs DROP COLUMN "restrictedAssetTypes"',
    );
  }
}
