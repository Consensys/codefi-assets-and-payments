import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableUserEntityLinkWorkflows1591866322948
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "public"."userEntityLinkWorkflows" (
                "id" serial,
                "userId" varchar(255),
                "name" varchar(255),
                "processOrder" _varchar,
                "mapStatusToInvestorAction" json,
                "mapStatusToIssuerAction" json,
                "mapStatusToNotaryAction" json,
                "createdAt" timestamptz NOT NULL DEFAULT now(),
                "updatedAt" timestamptz NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('userEntityLinkWorkflows');
  }
}
