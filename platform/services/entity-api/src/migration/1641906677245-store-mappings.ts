import { MigrationInterface, QueryRunner } from 'typeorm'

export class storeMappings1641906677245 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tenant_stores" ("tenantId" character varying NOT NULL, "walletType" wallets_type_enum NOT NULL, "storeId" character varying NOT NULL, "createdAt" timestamp without time zone NOT NULL DEFAULT now(), "updatedAt" timestamp without time zone NOT NULL DEFAULT now(), "deletedDate" timestamp without time zone, CONSTRAINT "tenant_stores_pkey" PRIMARY KEY ("tenantId", "walletType"), CONSTRAINT "tenant_stores_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION)`,
    )
    await queryRunner.query(
      `CREATE TABLE "entity_stores" ("tenantId" character varying NOT NULL, "entityId" character varying NOT NULL, "walletType" wallets_type_enum NOT NULL, "storeId" character varying NOT NULL, "createdAt" timestamp without time zone NOT NULL DEFAULT now(), "updatedAt" timestamp without time zone NOT NULL DEFAULT now(), "deletedDate" timestamp without time zone, CONSTRAINT "entity_stores_pkey" PRIMARY KEY ("tenantId", "entityId", "walletType"), CONSTRAINT "entity_stores_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION, CONSTRAINT "entity_stores_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION)`,
    )
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "storeId" character varying`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tenant_stores"`)
    await queryRunner.query(`DROP TABLE "entity_stores"`)
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "storeId"`)
  }
}
