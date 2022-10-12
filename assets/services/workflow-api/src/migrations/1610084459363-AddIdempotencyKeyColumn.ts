import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class AddIdempotencyKeyColumn1610084459363
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'workflow_instance',
      new TableColumn({
        name: 'idempotencyKey',
        type: 'varchar',
        isNullable: true,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('workflow_instance', 'idempotencyKey')
  }
}
