import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableUser1599547235136 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        UPDATE users SET "userType" = 'ADMIN' WHERE "userType" = 'SUPERADMIN';
        UPDATE users SET "tenantId" = 'codefi' WHERE "userType" = 'SUPERADMIN';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        UPDATE users SET "userType" = 'SUPERADMIN' WHERE "userType" = 'ADMIN';
    `);
  }
}
