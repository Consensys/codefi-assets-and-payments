import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import {
  DATABASE_TABLES,
  DEFAULT_TENANT_ID,
  DEFAULT_INITIALIZATION_TENANT_ID,
} from 'src/utils/constants';

export class AddTenantIdColumn1597988828939 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(DATABASE_TABLES.TOKENS, 'tenantIds');
    await queryRunner.dropColumn(DATABASE_TABLES.USERS, 'tenantIds');
    await queryRunner.dropColumn(DATABASE_TABLES.ASSET_TEMPLATES, 'tenantIds');
    await queryRunner.dropColumn(DATABASE_TABLES.ASSET_INSTANCES, 'tenantIds');

    await queryRunner.addColumn(
      DATABASE_TABLES.TOKENS,
      new TableColumn({
        name: 'tenantId',
        type: 'varchar',
        isNullable: false,
        default: DEFAULT_INITIALIZATION_TENANT_ID,
      }),
    );
    await queryRunner.addColumn(
      DATABASE_TABLES.USERS,
      new TableColumn({
        name: 'tenantId',
        type: 'varchar',
        isNullable: false,
        default: DEFAULT_INITIALIZATION_TENANT_ID,
      }),
    );
    await queryRunner.addColumn(
      DATABASE_TABLES.ASSET_TEMPLATES,
      new TableColumn({
        name: 'tenantId',
        type: 'varchar',
        isNullable: false,
        default: `'${DEFAULT_TENANT_ID}'`,
      }),
    );
    await queryRunner.addColumn(
      DATABASE_TABLES.ASSET_INSTANCES,
      new TableColumn({
        name: 'tenantId',
        type: 'varchar',
        isNullable: false,
        default: DEFAULT_INITIALIZATION_TENANT_ID,
      }),
    );
    await queryRunner.addColumn(
      DATABASE_TABLES.ASSET_CYCLE_INSTANCES,
      new TableColumn({
        name: 'tenantId',
        type: 'varchar',
        isNullable: false,
        default: DEFAULT_INITIALIZATION_TENANT_ID,
      }),
    );
    await queryRunner.addColumn(
      DATABASE_TABLES.ASSET_ELEMENTS,
      new TableColumn({
        name: 'tenantId',
        type: 'varchar',
        isNullable: false,
        default: `'${DEFAULT_TENANT_ID}'`,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(DATABASE_TABLES.TOKENS, 'tenantId');
    await queryRunner.dropColumn(DATABASE_TABLES.USERS, 'tenantId');
    await queryRunner.dropColumn(DATABASE_TABLES.ASSET_TEMPLATES, 'tenantId');
    await queryRunner.dropColumn(DATABASE_TABLES.ASSET_INSTANCES, 'tenantId');
    await queryRunner.dropColumn(
      DATABASE_TABLES.ASSET_CYCLE_INSTANCES,
      'tenantId',
    );
    await queryRunner.dropColumn(DATABASE_TABLES.ASSET_ELEMENTS, 'tenantId');
    await queryRunner.addColumn(
      DATABASE_TABLES.TOKENS,
      new TableColumn({
        name: 'tenantIds',
        type: 'varchar',
        isArray: true,
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      DATABASE_TABLES.USERS,
      new TableColumn({
        name: 'tenantIds',
        type: 'varchar',
        isArray: true,
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      DATABASE_TABLES.ASSET_TEMPLATES,
      new TableColumn({
        name: 'tenantIds',
        type: 'varchar',
        isArray: true,
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      DATABASE_TABLES.ASSET_INSTANCES,
      new TableColumn({
        name: 'tenantIds',
        type: 'varchar',
        isArray: true,
        isNullable: true,
      }),
    );
  }
}
