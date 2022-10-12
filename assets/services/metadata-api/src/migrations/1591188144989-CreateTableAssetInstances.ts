import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class CreateTableAssetInstances1591188144989
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: DATABASE_TABLES.ASSET_INSTANCES,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'tenantIds',
            type: 'varchar',
            isNullable: true,
            isArray: true,
          },
          {
            name: 'entityId',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'templateId',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'issuerId',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'elementInstances',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'data',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            isNullable: false,
            default: 'NOW()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            isNullable: false,
            default: 'NOW()',
          },
        ],
      }),
      true,
      false,
      false,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(DATABASE_TABLES.ASSET_INSTANCES);
  }
}
