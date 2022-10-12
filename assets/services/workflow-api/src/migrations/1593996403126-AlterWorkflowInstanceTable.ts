import { MigrationInterface, QueryRunner } from 'typeorm'

export class AlterWorkflowInstanceTable1593996403126
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      ALTER TABLE public.workflow_instance
      RENAME "startDate" TO "date";
      ALTER TABLE public.workflow_instance
      ADD COLUMN "assetClassKey" character varying,
      ADD COLUMN "value" numeric,
      ADD COLUMN "price" numeric,
      ADD COLUMN "documentId" character varying,
      ADD COLUMN "paymentId" character varying
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      ALTER TABLE public.workflow_instance
      RENAME "date" TO "startDate";
      ALTER TABLE public.workflow_instance
      DROP COLUMN "assetClassKey",
      DROP COLUMN "value",
      DROP COLUMN "price",
      DROP COLUMN "documentId",
      DROP COLUMN "paymentId"
    `)
  }
}
