import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTableUsersUserId1590667119563 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        ALTER TABLE users
        RENAME COLUMN "userId" TO id;
      `,
    );
  }

  public async down(): Promise<null> {
    return null;
  }
}
