import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class AddBrokerIdKeyColumn1621609861204 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'workflow_instance',
      new TableColumn({
        name: 'brokerId',
        type: 'varchar',
        isNullable: true,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('workflow_instance', 'brokerId')
  }
}
