import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCreatedAtUpdatedAtDefault1590665056316
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
            ALTER TABLE users ALTER COLUMN "createdAt" SET DEFAULT now();
            ALTER TABLE users ALTER COLUMN "updatedAt" SET DEFAULT now();
            ALTER TABLE securities ALTER COLUMN "createdAt" SET DEFAULT now();
            ALTER TABLE securities ALTER COLUMN "updatedAt" SET DEFAULT now();
        `,
    );
  }

  public async down(): Promise<null> {
    return null;
  }
}
