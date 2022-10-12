import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class I18n1613033583685 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      DATABASE_TABLES.CONFIGS,
      new TableColumn({
        name: 'language',
        type: 'varchar',
        isNullable: false,
        default: "'en'",
      }),
    );

    await queryRunner.addColumn(
      DATABASE_TABLES.CONFIGS,
      new TableColumn({
        name: 'region',
        type: 'varchar',
        isNullable: false,
        default: "'en-UK'",
      }),
    );

    await queryRunner.addColumn(
      DATABASE_TABLES.CONFIGS,
      new TableColumn({
        name: 'userId',
        type: 'varchar',
        isNullable: false,
        isPrimary: true,
        default: "'tenant'",
      }),
    );

    await queryRunner.addColumn(
      DATABASE_TABLES.CONFIGS,
      new TableColumn({
        name: 'preferences',
        type: 'json',
        isNullable: true,
      }),
    );

    const table = await queryRunner.getTable(DATABASE_TABLES.CONFIGS);
    const tenantIdColumn = table?.findColumnByName('tenantId');
    const changedTenantIdColumn = tenantIdColumn?.clone();
    if (changedTenantIdColumn) {
      changedTenantIdColumn.isUnique = false;
      await queryRunner.changeColumn(
        DATABASE_TABLES.CONFIGS,
        'tenantId',
        changedTenantIdColumn,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(DATABASE_TABLES.CONFIGS, 'language');
    await queryRunner.dropColumn(DATABASE_TABLES.CONFIGS, 'region');
    await queryRunner.dropColumn(DATABASE_TABLES.CONFIGS, 'userId');
    await queryRunner.dropColumn(DATABASE_TABLES.CONFIGS, 'preferences');
    const table = await queryRunner.getTable(DATABASE_TABLES.CONFIGS);
    const tenantIdColumn = table?.findColumnByName('tenantId');
    const changedTenantIdColumn = tenantIdColumn?.clone();

    if (changedTenantIdColumn) {
      changedTenantIdColumn.isUnique = true;
      await queryRunner.changeColumn(
        DATABASE_TABLES.CONFIGS,
        'tenantId',
        changedTenantIdColumn,
      );
    }
  }
}
