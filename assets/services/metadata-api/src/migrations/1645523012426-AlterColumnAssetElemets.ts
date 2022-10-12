import { DATABASE_TABLES } from 'src/utils/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterColumnAssetElemets1645523012426
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(DATABASE_TABLES.ASSET_ELEMENTS);
    const typeColumn = table?.findColumnByName('type');
    const changedTypeColumn = typeColumn?.clone();

    if (changedTypeColumn && changedTypeColumn.enum) {
      changedTypeColumn.enum = [...changedTypeColumn.enum, 'bank'];
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
      ];
      await queryRunner.changeColumn(
        DATABASE_TABLES.ASSET_ELEMENTS,
        'type',
        changedTypeColumn,
      );
    }
  }
}
