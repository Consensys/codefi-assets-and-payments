import { MigrationInterface, QueryRunner } from 'typeorm'

export class tokenIdToAddress1624886256114 implements MigrationInterface {
  name = 'tokenIdToAddress1624886256114'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "operation_request_entity" RENAME COLUMN "tokenId" TO "tokenAddress"`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "operation_request_entity" RENAME COLUMN "tokenAddress" TO "tokenId"`,
    )
  }
}
