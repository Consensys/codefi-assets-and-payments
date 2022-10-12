import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm'
import { DATABASE_TABLES } from 'src/utils/constants'

export class AddTablesIndexes1637923223010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      DATABASE_TABLES.TRANSACTION,
      new TableIndex({
        name: `UX_${DATABASE_TABLES.TRANSACTION}_tenantId_id`,
        columnNames: ['tenantId', 'id'],
        isUnique: true,
      }),
    )
    await queryRunner.createIndex(
      DATABASE_TABLES.TRANSITION_INSTANCE,
      new TableIndex({
        name: `UX_${DATABASE_TABLES.TRANSITION_INSTANCE}_tenantId_id`,
        columnNames: ['tenantId', 'id'],
        isUnique: true,
      }),
    )
    await queryRunner.createIndex(
      DATABASE_TABLES.WORKFLOW_INSTANCE,
      new TableIndex({
        name: `UX_${DATABASE_TABLES.WORKFLOW_INSTANCE}_tenantId_id`,
        columnNames: ['tenantId', 'id'],
        isUnique: true,
      }),
    )
    await queryRunner.createIndex(
      DATABASE_TABLES.WORKFLOW_TEMPLATE,
      new TableIndex({
        name: `UX_${DATABASE_TABLES.WORKFLOW_TEMPLATE}_tenantId_id`,
        columnNames: ['tenantId', 'id'],
        isUnique: true,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      DATABASE_TABLES.TRANSACTION,
      `UX_${DATABASE_TABLES.TRANSACTION}_tenantId_id`,
    )
    await queryRunner.dropIndex(
      DATABASE_TABLES.TRANSITION_INSTANCE,
      `UX_${DATABASE_TABLES.TRANSITION_INSTANCE}_tenantId_id`,
    )
    await queryRunner.dropIndex(
      DATABASE_TABLES.WORKFLOW_INSTANCE,
      `UX_${DATABASE_TABLES.WORKFLOW_INSTANCE}_tenantId_id`,
    )
    await queryRunner.dropIndex(
      DATABASE_TABLES.WORKFLOW_TEMPLATE,
      `UX_${DATABASE_TABLES.WORKFLOW_TEMPLATE}_tenantId_id`,
    )
  }
}
