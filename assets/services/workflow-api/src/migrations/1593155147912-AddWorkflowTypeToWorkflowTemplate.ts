import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddWorkflowTypeToWorkflowTemplate1593155147912
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      ALTER TABLE public.workflow_template
      ADD COLUMN "workflowType" character varying
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      ALTER TABLE public.workflow_template
      DROP COLUMN "workflowType"
    `)
  }
}
