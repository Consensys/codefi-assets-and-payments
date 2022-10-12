import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSyndicatedLoanAssetTemplateType1606297290795
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.asset_templates ALTER COLUMN "type" TYPE VARCHAR(255);
      DROP TYPE IF EXISTS public."asset_templates_type_enum" cascade;
      CREATE TYPE "asset_templates_type_enum" AS ENUM ('PHYSICAL_ASSET', 'OPEN_END_FUND', 'CLOSED_END_FUND', 'SYNDICATED_LOAN');
      ALTER TABLE public.asset_templates ALTER COLUMN "type" TYPE public."asset_templates_type_enum" USING ("type"::text::public."asset_templates_type_enum");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
                ALTER TABLE public.asset_templates
                ALTER COLUMN "type" TYPE VARCHAR(255);
                DROP TYPE IF EXISTS public."asset_templates_type_enum";
                CREATE TYPE "asset_templates_type_enum" AS ENUM ('PHYSICAL_ASSET', 'OPEN_END_FUND', 'CLOSED_END_FUND');
                ALTER TABLE public.asset_templates
                ALTER COLUMN "type" TYPE public."asset_templates_type_enum" USING ("type"::text::public."asset_templates_type_enum");
      `);
  }
}
