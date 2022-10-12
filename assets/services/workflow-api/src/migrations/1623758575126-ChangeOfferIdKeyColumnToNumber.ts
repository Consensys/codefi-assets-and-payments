import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class ChangeOfferIdKeyColumnToNumber1623758575126
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'workflow_instance',
      'offerId',
      new TableColumn({
        name: 'offerId',
        type: 'int',
        isNullable: true,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'workflow_instance',
      'offerId',
      new TableColumn({
        name: 'offerId',
        type: 'varchar',
        isNullable: true,
      }),
    )
  }
}
