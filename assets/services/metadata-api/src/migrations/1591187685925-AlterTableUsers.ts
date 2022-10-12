import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class AlterTableUsers1591187685925 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      DATABASE_TABLES.USERS,
      new TableColumn({
        name: 'tenantIds',
        type: 'varchar',
        isArray: true,
        isNullable: true,
      }),
    );
    await queryRunner.renameColumn(
      DATABASE_TABLES.USERS,
      'defaultAccountAddress',
      'defaultWallet',
    );
    await queryRunner.renameColumn(
      DATABASE_TABLES.USERS,
      'accounts',
      'wallets',
    );
    await queryRunner.renameColumn(
      DATABASE_TABLES.USERS,
      'bankAccountDetail',
      'bankAccount',
    );
  }

  public async down(): Promise<null> {
    return null;
  }
}
