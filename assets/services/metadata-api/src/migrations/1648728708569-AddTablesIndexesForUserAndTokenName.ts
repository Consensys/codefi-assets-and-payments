import { DATABASE_TABLES } from 'src/utils/constants';
import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddTablesIndexesForUserAndTokenName1648728708569
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      DATABASE_TABLES.TOKENS,
      new TableIndex({
        name: `UX_${DATABASE_TABLES.TOKENS}_tenantId_name`,
        columnNames: ['tenantId', 'name'],
      }),
    );
    await queryRunner.createIndex(
      DATABASE_TABLES.TOKENS,
      new TableIndex({
        name: `UX_${DATABASE_TABLES.TOKENS}_tenantId_defaultDeployment`,
        columnNames: ['tenantId', 'defaultDeployment'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      DATABASE_TABLES.TOKENS,
      `UX_${DATABASE_TABLES.TOKENS}_tenantId_name`,
    );
    await queryRunner.dropIndex(
      DATABASE_TABLES.TOKENS,
      `UX_${DATABASE_TABLES.TOKENS}_tenantId_defaultDeployment`,
    );
  }
}
