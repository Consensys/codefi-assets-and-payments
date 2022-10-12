import { MigrationInterface, QueryRunner } from 'typeorm'

export class tenantentity1636127405471 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tenant_entity" ("id" character varying NOT NULL, "metadata" character varying NOT NULL, "name" character varying NOT NULL, "defaultNetworkKey" character varying NOT NULL, "createdAt" TIMESTAMP)`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tenant_entity"`)
  }
}
