import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSubscriptionStartDate1621273148148
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "asset_cycle_instances" RENAME COLUMN "subscriptionStartDate" TO "startDate"',
    );
    await queryRunner.query(
      'ALTER TABLE "asset_cycle_instances" RENAME COLUMN "subscriptionEndDate" TO "endDate"',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "asset_cycle_instances" RENAME COLUMN "startDate" TO "subscriptionStartDate"',
    );
    await queryRunner.query(
      'ALTER TABLE "asset_cycle_instances" RENAME COLUMN "endDate" TO "subscriptionEndDate"',
    );
  }
}
