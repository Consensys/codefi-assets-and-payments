import { MigrationInterface, QueryRunner } from 'typeorm'

export class AlterWorkflowInstanceTableAllowNull1644577710606
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(
      `ALTER TABLE public.workflow_instance ALTER COLUMN "userId" DROP NOT NULL`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(
      `ALTER TABLE public.workflow_instance ALTER COLUMN "userId" SET NOT NULL`,
    )
  }
}
