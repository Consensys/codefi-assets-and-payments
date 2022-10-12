import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterEntityTypeRenameUserToIssuer1591792362913
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TYPE "links_entitytype_enum" RENAME VALUE 'USER' TO 'ISSUER';
    `);
  }

  public async down(): Promise<null> {
    return null;
  }
}
