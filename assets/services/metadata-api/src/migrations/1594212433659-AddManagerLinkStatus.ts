import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddManagerLinkStatus1594212433659 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TYPE "links_status_enum" ADD VALUE 'navManager';
    `);
  }

  public async down(): Promise<null> {
    return null;
  }
}
