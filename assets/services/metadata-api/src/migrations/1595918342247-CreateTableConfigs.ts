import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class CreateTableConfigs1595918342247 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: DATABASE_TABLES.CONFIGS,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'tenantId',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'logo',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'mainColor',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'mainColorLight',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'mainColorLighter',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'mainColorDark',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'mainColorDarker',
            type: 'varchar',
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
    await queryRunner.dropTable(DATABASE_TABLES.CONFIGS);
  }
}
