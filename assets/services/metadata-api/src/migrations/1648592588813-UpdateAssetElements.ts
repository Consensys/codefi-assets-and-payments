import { DATABASE_TABLES } from 'src/utils/constants';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateAssetElements1648592588813 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      DATABASE_TABLES.ASSET_ELEMENTS,
      new TableColumn({
        name: 'hidden',
        type: 'boolean',
        isNullable: true,
        default: false,
      }),
    );
    await queryRunner.addColumn(
      DATABASE_TABLES.ASSET_ELEMENTS,
      new TableColumn({
        name: 'defaultValue',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns(DATABASE_TABLES.ASSET_ELEMENTS, [
      'hidden',
      'defaultValue',
    ]);
  }
}
