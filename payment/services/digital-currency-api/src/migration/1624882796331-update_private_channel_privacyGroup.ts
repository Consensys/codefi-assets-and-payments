import { MigrationInterface, QueryRunner } from 'typeorm'

export class updatePrivateChannelPrivacyGroup1624882796331
  implements MigrationInterface
{
  name = 'updatePrivateChannelPrivacyGroup1624882796331'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "operation_request_entity" RENAME COLUMN "channelId" TO "privacyGroupId"`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "operation_request_entity" RENAME COLUMN "privacyGroupId" TO "channelId"`,
    )
  }
}
