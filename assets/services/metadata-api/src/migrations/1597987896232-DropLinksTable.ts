import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropLinksTable1597987896232 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('links', true, true);
  }

  public async down(): Promise<null> {
    return null;
  }
}
