import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProjectEntityType1597746687983 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE public.workflow_instance
        ALTER COLUMN "entityType" TYPE VARCHAR(255);
        DROP TYPE IF EXISTS public.entitytype_enum;
        CREATE TYPE entitytype_enum AS ENUM ('TOKEN', 'ASSET_CLASS', 'ISSUER', 'ADMIN', 'PROJECT');
        ALTER TABLE public.workflow_instance
        ALTER COLUMN "entityType" TYPE public.entitytype_enum USING ("entityType"::text::public.entitytype_enum);
    `)
  }

  public async down(): Promise<void> {
    return null
  }
}
