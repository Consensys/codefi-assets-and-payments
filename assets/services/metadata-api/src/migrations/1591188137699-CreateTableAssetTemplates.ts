import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class CreateTableAssetTemplates1591188137699
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: DATABASE_TABLES.ASSET_TEMPLATES,
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
            name: 'name',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['OPEN_END_FUND', 'CLOSED_END_FUND', 'PHYSICAL_ASSET'],
            enumName: 'asset_templates_type_enum',
            isNullable: false,
          },
          {
            name: 'label',
            type: 'json',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'topSections',
            type: 'text',
            isNullable: false,
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
    await queryRunner.dropTable(DATABASE_TABLES.ASSET_TEMPLATES);
  }
}
