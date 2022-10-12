import { DATABASE_TABLES } from 'src/utils/constants';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateTokensTable1637246040935 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns(DATABASE_TABLES.TOKENS, [
      'formula',
      'assetInstanceId',
    ]);
    await queryRunner.addColumn(
      DATABASE_TABLES.TOKENS,
      new TableColumn({
        name: 'creatorId',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      DATABASE_TABLES.TOKENS,
      new TableColumn({
        name: 'reviewerId',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      DATABASE_TABLES.ASSET_ELEMENTS,
      new TableColumn({
        name: 'map',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      DATABASE_TABLES.ASSET_ELEMENTS,
      new TableColumn({
        name: 'updatable',
        type: 'boolean',
        isNullable: false,
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      DATABASE_TABLES.TOKENS,
      new TableColumn({
        name: 'formula',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      DATABASE_TABLES.TOKENS,
      new TableColumn({
        name: 'assetInstanceId',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.dropColumns(DATABASE_TABLES.TOKENS, [
      'reviewerId',
      'creatorId',
    ]);
    await queryRunner.dropColumns(DATABASE_TABLES.ASSET_ELEMENTS, [
      'map',
      'updatable',
    ]);
  }
}
