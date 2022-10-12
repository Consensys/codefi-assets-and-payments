import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class CreateTableProjects1597249650815 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: DATABASE_TABLES.PROJECTS,
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
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'picture',
            type: 'json',
            isNullable: false,
          },
          {
            name: 'bankAccount',
            type: 'json',
            isNullable: false,
          },
          {
            name: 'kycTemplateId',
            type: 'varchar',
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
    await queryRunner.dropTable(DATABASE_TABLES.PROJECTS);
  }
}
