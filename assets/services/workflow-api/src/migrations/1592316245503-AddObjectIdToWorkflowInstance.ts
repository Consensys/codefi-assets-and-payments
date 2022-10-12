import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddObjectIdToWorkflowInstance1592316245503
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      ALTER TABLE public.workflow_instance
      ADD COLUMN "objectId" character varying
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      ALTER TABLE public.workflow_instance
      DROP COLUMN "objectId"
    `)
  }
}
