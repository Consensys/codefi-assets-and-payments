import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNavManagerUserType1595255362429 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TYPE "enum_users_userType" ADD VALUE 'NAV_MANAGER';
    `);
  }

  public async down(): Promise<null> {
    return null;
  }
}
