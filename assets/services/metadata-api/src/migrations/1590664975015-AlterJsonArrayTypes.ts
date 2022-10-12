import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterJsonArrayTypes1590664975015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        ALTER TABLE users ALTER COLUMN accounts TYPE text;
        ALTER TABLE securities ALTER COLUMN deployments TYPE text;
      `,
    );
  }

  public async down(): Promise<null> {
    return null;
  }
}
