import { MigrationInterface, QueryRunner } from 'typeorm';

import { createEnumType } from 'src/utils/migrationUtils';

export class CreateLinksTable1590618775111 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await createEnumType(
      queryRunner,
      'links_entitytype_enum',
      "'TOKEN', 'USER'",
    );
    await createEnumType(
      queryRunner,
      'links_status_enum',
      "'issuer', 'notary', 'verifier', 'invited', 'kycSubmitted', 'validated', 'KycInReview'",
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."links" (
        "id" serial,
        "tenantIds" _varchar,
        "userId" varchar,
        "entityId" varchar,
        "entityType" "public"."links_entitytype_enum" NOT NULL,
        "status" "public"."links_status_enum" NOT NULL,
        "walletAddress" varchar,
        "data" json NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "links"');
  }
}
