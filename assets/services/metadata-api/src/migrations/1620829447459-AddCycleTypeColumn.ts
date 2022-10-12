import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCycleTypeColumn1620829447459 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TYPE \"enum_cycle_type\" AS ENUM('subscription', 'redemption')",
    );
    await queryRunner.query(
      'ALTER TABLE "asset_cycle_instances" ADD "type" "enum_cycle_type" NOT NULL DEFAULT \'subscription\'',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "asset_cycle_instances" DROP COLUMN "type"',
    );
    await queryRunner.query('DROP TYPE "enum_cycle_type"');
  }
}
