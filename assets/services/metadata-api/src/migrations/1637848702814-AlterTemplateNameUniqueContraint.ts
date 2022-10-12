import { MigrationInterface, QueryRunner, TableUnique } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class AlterTemplateNameUniqueContraint1637848702814
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const assetTemplatesTable = await queryRunner.getTable(
      DATABASE_TABLES.ASSET_TEMPLATES,
    );
    // find composite unique constraint to delete
    const unique = assetTemplatesTable?.uniques.find(
      (u) => u.columnNames.length === 1 && u.columnNames[0] === 'name',
    );
    if (unique && assetTemplatesTable) {
      await queryRunner.dropUniqueConstraint(assetTemplatesTable, unique);
    }
    if (assetTemplatesTable)
      await queryRunner.createUniqueConstraint(
        assetTemplatesTable,
        new TableUnique({
          name: `UQ_${DATABASE_TABLES.ASSET_TEMPLATES}_tenantId_name`,
          columnNames: ['name', 'tenantId'],
        }),
      );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const assetTemplatesTable = await queryRunner.getTable(
      DATABASE_TABLES.ASSET_TEMPLATES,
    );
    if (assetTemplatesTable) {
      await queryRunner.createUniqueConstraint(
        assetTemplatesTable,
        new TableUnique({ columnNames: ['name'] }),
      );
      await queryRunner.dropUniqueConstraint(
        assetTemplatesTable,
        new TableUnique({
          name: `UQ_${DATABASE_TABLES.ASSET_TEMPLATES}_tenantId_name`,
          columnNames: ['name', 'tenantId'],
        }),
      );
    }
  }
}
