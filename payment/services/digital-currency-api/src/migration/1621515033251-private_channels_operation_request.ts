import { MigrationInterface, QueryRunner } from 'typeorm'

export class privateChannelsOperationRequest1621515033251
  implements MigrationInterface
{
  name = 'privateChannelsOperationRequest1621515033251'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "operation_request_entity" ("id" character varying NOT NULL, "type" character varying NOT NULL, "requester" character varying NOT NULL, "issuer" character varying NOT NULL, "amount" character varying NOT NULL, "tokenId" character varying NOT NULL, "symbol" character varying NOT NULL, "chainName" character varying NOT NULL, "state" character varying NOT NULL, "preRequirementOperationId" character varying, "resolutionOperationId" character varying, "tenantId" character varying NOT NULL, "subject" character varying NOT NULL, "channelId" character varying NOT NULL, CONSTRAINT "PK_f1a3b746c4d64c4aaf8758a7f22" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "private_channel_entity" ("id" character varying NOT NULL, "channelName" character varying NOT NULL, "description" character varying NOT NULL, "chainName" character varying NOT NULL, "transactionHash" character varying, "blockNumber" integer, "participants" text array NOT NULL, "privacyGroup" character varying NOT NULL, CONSTRAINT "PK_c7a20915fa2a6e16719a7eb54c4" PRIMARY KEY ("id"))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "private_channel_entity"`)
    await queryRunner.query(`DROP TABLE "operation_request_entity"`)
  }
}
