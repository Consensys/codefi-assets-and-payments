import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class clients1643712713006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "entity_status_enum" AS ENUM('pending', 'confirmed', 'failed')`,
    )
    await queryRunner.query(
      `CREATE TYPE "client_type_enum" AS ENUM('spa', 'non_interactive')`,
    )
    await queryRunner.query(
      `CREATE TABLE "clients" (${[
        `"id" character varying NOT NULL`,
        `"tenantId" character varying NOT NULL`,
        `"entityId" character varying`,
        `"name" character varying NOT NULL`,
        `"type" client_type_enum NOT NULL`,
        `"status" entity_status_enum NOT NULL`,
        `"clientId" character varying`,
        `"createdAt" timestamp without time zone NOT NULL DEFAULT now()`,
        `"updatedAt" timestamp without time zone NOT NULL DEFAULT now()`,
        `"deletedDate" timestamp without time zone`,
        `CONSTRAINT "clients_pkey" PRIMARY KEY ("id")`,
        `CONSTRAINT "clients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION`,
        `CONSTRAINT "clients_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION`,
        `CONSTRAINT "clients_tenantId_entityId_name_unique" UNIQUE ("tenantId", "entityId", "name")`,
      ].join(', ')})`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "clients"`)
    await queryRunner.query(`DROP TYPE "client_type_enum"`)
    await queryRunner.query(`DROP TYPE "entity_status_enum"`)
  }
}
