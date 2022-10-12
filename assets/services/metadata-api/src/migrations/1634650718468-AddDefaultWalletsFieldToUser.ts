import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class AddDefaultWalletsFieldToUser1634650718468
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      DATABASE_TABLES.USERS,
      new TableColumn({
        name: 'defaultWallets',
        type: 'jsonb',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(DATABASE_TABLES.USERS, 'defaultWallets');
  }
}
