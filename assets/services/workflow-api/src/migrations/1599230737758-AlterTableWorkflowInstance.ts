import { MigrationInterface, QueryRunner } from 'typeorm'

export class AlterTableWorkflowInstance1599230737758
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('workflow_instance', 'value', 'quantity')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('workflow_instance', 'quantity', 'value')
  }
}
