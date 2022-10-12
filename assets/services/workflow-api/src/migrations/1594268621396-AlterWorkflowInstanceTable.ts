import { MigrationInterface, QueryRunner } from 'typeorm'
import { createEnumType } from 'src/utils/migrationUtils'

export class AlterWorkflowInstanceTable1594268621396
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await createEnumType(
      queryRunner,
      'entitytype_enum',
      "'TOKEN', 'ASSET_CLASS', 'ISSUER', 'ADMIN'",
    )
    await queryRunner.query(`
        ALTER TABLE public.workflow_instance
        RENAME "tokenId" TO "entityId";
        ALTER TABLE public.workflow_instance
        ADD COLUMN "entityType" "public"."entitytype_enum";
        ALTER TABLE public.workflow_instance
        ADD COLUMN "wallet" character varying;
        ALTER TABLE public.workflow_instance
        DROP COLUMN "nav";
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE public.workflow_instance
        RENAME "entityId" TO "tokenId";
        ALTER TABLE public.workflow_instance
        DROP COLUMN "entityType";
        ALTER TABLE public.workflow_instance
        DROP COLUMN "wallet";
        ALTER TABLE public.workflow_instance
        ADD COLUMN "nav" numeric;
    `)
  }
}
