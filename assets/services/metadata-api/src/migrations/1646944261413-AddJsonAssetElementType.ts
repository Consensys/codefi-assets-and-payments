import { MigrationInterface, QueryRunner } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class AddJsonAssetElementType1645521118971
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(DATABASE_TABLES.ASSET_ELEMENTS);
    const typeColumn = table?.findColumnByName('type');
    const changedTypeColumn = typeColumn?.clone();

    if (changedTypeColumn && changedTypeColumn.enum) {
      changedTypeColumn.enum = [...changedTypeColumn.enum, 'json'];
      await queryRunner.changeColumn(
        DATABASE_TABLES.ASSET_ELEMENTS,
        'type',
        changedTypeColumn,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(DATABASE_TABLES.ASSET_ELEMENTS);
    const typeColumn = table?.findColumnByName('type');
    const changedTypeColumn = typeColumn?.clone();

    if (changedTypeColumn) {
      changedTypeColumn.enum = [
        'string',
        'document',
        'check',
        'radio',
        'multistring',
        'number',
        'title',
        'date',
        'time',
        'percentage',
        'timeAfterSubscription',
        'target',
        'feeWithType',
        'periodSelect',
        'perPercentage',
        'docusign',
        'team',
        'bank',
      ];
      await queryRunner.changeColumn(
        DATABASE_TABLES.ASSET_ELEMENTS,
        'type',
        changedTypeColumn,
      );
    }
  }
}
