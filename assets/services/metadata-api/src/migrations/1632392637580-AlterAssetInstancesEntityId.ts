import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterAssetInstancesEntityId1632392637580
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "asset_instances" RENAME COLUMN "entityId" TO "tokenId"',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "asset_instances" RENAME COLUMN "tokenId" TO "entityId"',
    );
  }
}
