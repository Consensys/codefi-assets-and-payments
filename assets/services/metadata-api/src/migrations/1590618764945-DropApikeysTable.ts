import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropApikeysTable1590618764945 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('apikeys', true, true);
  }

  public async down(): Promise<null> {
    return null;
  }
}
