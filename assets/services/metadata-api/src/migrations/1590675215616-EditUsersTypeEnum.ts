import { MigrationInterface, QueryRunner } from 'typeorm';

export class EditUsersTypeEnum1590675215616 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TYPE "enum_users_userType" RENAME VALUE 'ADMIN' TO 'ISSUER';
        ALTER TYPE "enum_users_userType" RENAME VALUE 'USER' TO 'INVESTOR';
        ALTER TYPE "enum_users_userType" ADD VALUE 'ADMIN';
        ALTER TYPE "enum_users_userType" ADD VALUE 'VERIFIER';
    `);
  }

  public async down(): Promise<null> {
    return null;
  }
}
