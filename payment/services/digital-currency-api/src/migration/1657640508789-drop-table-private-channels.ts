import { MigrationInterface, QueryRunner } from 'typeorm'

export class dropTablePrivateChannels1657640508789
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "private_channel_entity"`)

    await queryRunner.query(
      `ALTER TABLE IF EXISTS "operation_request_entity" DROP COLUMN "privacyGroupId"`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "private_channel_entity" ("id" character varying NOT NULL, "channelName" character varying NOT NULL, "description" character varying NOT NULL, "chainName" character varying NOT NULL, "transactionHash" character varying, "blockNumber" integer, "participants" text array NOT NULL, "privacyGroup" character varying NOT NULL, CONSTRAINT "PK_c7a20915fa2a6e16719a7eb54c4" PRIMARY KEY ("id"))`,
    )

    await queryRunner.query(
      `ALTER TABLE IF EXISTS "operation_request_entity" ADD COLUMN "privacyGroupId" character varying`,
    )
  }
}
