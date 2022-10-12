import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

import { createEnumType } from 'src/utils/migrationUtils';

export class AlterTableUser1598245389651 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      DATABASE_TABLES.USERS,
      'defaultAccountSigType',
    );

    await queryRunner.query(
      'DROP TYPE IF EXISTS "enum_users_defaultAccountSigType";',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await createEnumType(
      queryRunner,
      '"enum_users_defaultAccountSigType"',
      "'FRONT', 'BACK'",
    );

    await queryRunner.addColumn(
      DATABASE_TABLES.USERS,
      new TableColumn({
        name: 'defaultAccountSigType',
        type: 'enum',
        enum: ['FRONT', 'BACK'],
        isNullable: true,
      }),
    );
  }
}
