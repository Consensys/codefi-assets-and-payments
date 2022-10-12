import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class CreateTableAssetElements1591191669667
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: DATABASE_TABLES.ASSET_ELEMENTS,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'key',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: [
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
            ],
            enumName: 'enum_asset_elements_type',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'mandatory',
              'optional',
              'conditionalOptional',
              'conditionalMandatory',
            ],
            enumName: 'enum_asset_elements_status',
            isNullable: false,
          },
          {
            name: 'label',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'sublabel',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'placeholder',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'rightTag',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'leftTag',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'multiline',
            type: 'boolean',
            isNullable: true,
          },
          {
            name: 'size',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'fileAccept',
            type: 'enum',
            enum: ['pdf', 'image'],
            enumName: 'enum_asset_elements_fileAccept',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'fillLine',
            type: 'boolean',
            isNullable: true,
          },
          {
            name: 'inputs',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'options',
            type: 'text',
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
    await queryRunner.dropTable(DATABASE_TABLES.ASSET_ELEMENTS);
  }
}
