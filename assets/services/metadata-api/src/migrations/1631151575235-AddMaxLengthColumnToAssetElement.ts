import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaxLengthToAssetElement1631151575235
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "asset_elements" ADD COLUMN "maxLength" integer',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "asset_elements" DROP COLUMN "maxLength"',
    );
  }
}
