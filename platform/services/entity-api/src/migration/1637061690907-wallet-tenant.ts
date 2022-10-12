import { MigrationInterface, QueryRunner } from 'typeorm'

export class walletTenant1637061690907 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "tenantId" character varying`,
    )
    await queryRunner.query(
      `UPDATE "wallets" SET "tenantId" = "entities"."tenantId" FROM "entities" WHERE "wallets"."entityId" = "entities"."id"`,
    )
    await queryRunner.query(
      `ALTER TABLE "wallets" ALTER COLUMN "tenantId" SET NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_95dd258490696a80308ba5a626c" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_95dd258490696a80308ba5a626c"`,
    )
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "tenantId"`)
  }
}
