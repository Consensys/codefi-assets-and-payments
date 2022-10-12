import { MigrationInterface, QueryRunner } from 'typeorm'

export class operationTransactionIdIndex1652705311785
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "operation_entity_transactionId_idx" ON "operation_entity" ("transactionId") `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "operation_entity_transactionId_idx"`)
  }
}
