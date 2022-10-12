import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterConfigAddRestrictedUserTypesColumn1621859453592
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE configs ADD COLUMN "restrictedUserTypes" text[] NOT NULL DEFAULT \'{}\'',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE configs DROP COLUMN "restrictedUserTypes"',
    );
  }
}
