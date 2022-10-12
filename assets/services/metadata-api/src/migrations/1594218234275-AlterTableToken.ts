import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class AlterTableToken1594218234275 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(DATABASE_TABLES.TOKENS, 'picture');
    await queryRunner.addColumn(
      DATABASE_TABLES.TOKENS,
      new TableColumn({
        name: 'picture',
        type: 'json',
        isNullable: true,
      }),
    );
  }

  public async down(): Promise<null> {
    return null;
  }
}
