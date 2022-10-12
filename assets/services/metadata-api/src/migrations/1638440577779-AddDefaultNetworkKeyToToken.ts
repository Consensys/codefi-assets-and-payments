import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class AddDefaultNetworkKeyToToken1638440577779
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      DATABASE_TABLES.TOKENS,
      new TableColumn({
        name: 'defaultNetworkKey',
        type: 'varchar(255)',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(DATABASE_TABLES.TOKENS, 'defaultNetworkKey');
  }
}
