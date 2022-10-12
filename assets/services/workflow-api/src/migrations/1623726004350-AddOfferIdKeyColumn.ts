import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class AddOfferIdKeyColumn1623726004350 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'workflow_instance',
      new TableColumn({
        name: 'offerId',
        type: 'varchar',
        isNullable: true,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('workflow_instance', 'offerId')
  }
}
