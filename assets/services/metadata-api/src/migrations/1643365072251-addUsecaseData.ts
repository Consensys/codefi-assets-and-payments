import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class addUsecaseData1643365072251 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: DATABASE_TABLES.ASSET_USECASES,
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
            isNullable: false,
            isArray: false,
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'config',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'keys',
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
    await queryRunner.dropTable(DATABASE_TABLES.ASSET_USECASES);
  }
}
