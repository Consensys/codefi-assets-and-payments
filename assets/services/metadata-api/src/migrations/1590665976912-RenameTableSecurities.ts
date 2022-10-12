import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTableSecurities1590665976912 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        ALTER TABLE securities RENAME TO tokens;
      `,
    );
    await queryRunner.query(
      `
        ALTER TABLE tokens
        RENAME COLUMN "securityId" TO id;
      `,
    );
  }

  public async down(): Promise<null> {
    return null;
  }
}
