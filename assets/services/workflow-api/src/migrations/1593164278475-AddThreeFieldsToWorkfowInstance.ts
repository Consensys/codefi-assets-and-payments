import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddThreeFieldsToWorkfowInstance1593164278475
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      ALTER TABLE public.workflow_instance
      ADD COLUMN "workflowType" character varying,
      ADD COLUMN "nav" numeric,
      ADD COLUMN "startDate" timestamp without time zone 
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      ALTER TABLE public.workflow_instance
      DROP COLUMN "workflowType",
      DROP COLUMN "nav",
      DROP COLUMN "startDate"
    `)
  }
}
