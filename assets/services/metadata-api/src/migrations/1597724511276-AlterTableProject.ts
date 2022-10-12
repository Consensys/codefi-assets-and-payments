import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class AlterTableProject1597724511276 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      DATABASE_TABLES.PROJECTS,
      new TableColumn({
        name: 'key',
        type: 'varchar',
        isNullable: false,
        default: "'default_key'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(DATABASE_TABLES.PROJECTS, 'key');
  }
}
