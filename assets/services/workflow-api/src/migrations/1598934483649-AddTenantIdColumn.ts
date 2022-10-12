import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'
import {
  DEFAULT_INITIALIZATION_TENANT_ID,
  DEFAULT_TENANT_ID,
} from 'src/utils/constants'

export class AddTenantIdColumn1598934483649 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('transaction', 'tenantId')
    await queryRunner.dropColumn('transition_instance', 'tenantId')
    await queryRunner.dropColumn('workflow_template', 'tenantIds')
    await queryRunner.dropColumn('workflow_instance', 'tenantId')

    await queryRunner.addColumn(
      'transaction',
      new TableColumn({
        name: 'tenantId',
        type: 'varchar',
        isNullable: false,
        default: DEFAULT_INITIALIZATION_TENANT_ID,
      }),
    )
    await queryRunner.addColumn(
      'transition_instance',
      new TableColumn({
        name: 'tenantId',
        type: 'varchar',
        isNullable: false,
        default: DEFAULT_INITIALIZATION_TENANT_ID,
      }),
    )
    await queryRunner.addColumn(
      'workflow_template',
      new TableColumn({
        name: 'tenantId',
        type: 'varchar',
        isNullable: false,
        default: `'${DEFAULT_TENANT_ID}'`,
      }),
    )
    await queryRunner.addColumn(
      'workflow_instance',
      new TableColumn({
        name: 'tenantId',
        type: 'varchar',
        isNullable: false,
        default: DEFAULT_INITIALIZATION_TENANT_ID,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('transaction', 'tenantId')
    await queryRunner.dropColumn('transition_instance', 'tenantId')
    await queryRunner.dropColumn('workflow_template', 'tenantId')
    await queryRunner.dropColumn('workflow_instance', 'tenantId')

    await queryRunner.addColumn(
      'transaction',
      new TableColumn({
        name: 'tenantId',
        type: 'varchar',
        isNullable: true,
      }),
    )
    await queryRunner.addColumn(
      'transition_instance',
      new TableColumn({
        name: 'tenantId',
        type: 'varchar',
        isNullable: true,
      }),
    )
    await queryRunner.addColumn(
      'workflow_template',
      new TableColumn({
        name: 'tenantIds',
        type: 'varchar',
        isNullable: true,
        isArray: true,
      }),
    )
    await queryRunner.addColumn(
      'workflow_instance',
      new TableColumn({
        name: 'tenantId',
        type: 'varchar',
        isNullable: true,
      }),
    )
  }
}
