import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class AlterTableTokens1591186523034 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      DATABASE_TABLES.TOKENS,
      new TableColumn({
        name: 'tenantIds',
        type: 'varchar',
        isArray: true,
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      DATABASE_TABLES.TOKENS,
      new TableColumn({
        name: 'issuerId',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.dropColumn(DATABASE_TABLES.TOKENS, 'abi');
    await queryRunner.renameColumn(
      DATABASE_TABLES.TOKENS,
      'contractType',
      'standard',
    );
    await queryRunner.renameColumn(
      DATABASE_TABLES.TOKENS,
      'processesIds',
      'workflowIds',
    );
    await queryRunner.renameColumn(
      DATABASE_TABLES.TOKENS,
      'defaultContractAddress',
      'defaultDeployment',
    );
    await queryRunner.renameColumn(
      DATABASE_TABLES.TOKENS,
      'bankDepositDetail',
      'bankAccount',
    );
    await queryRunner.addColumn(
      DATABASE_TABLES.TOKENS,
      new TableColumn({
        name: 'assetTemplateId',
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
    await queryRunner.addColumn(
      DATABASE_TABLES.TOKENS,
      new TableColumn({
        name: 'behaviours',
        type: 'varchar',
        isNullable: true,
        isArray: true,
      }),
    );
    await queryRunner.addColumn(
      DATABASE_TABLES.TOKENS,
      new TableColumn({
        name: 'formula',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(): Promise<null> {
    return null;
  }
}
