import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveStableCoinDiversityCreditEnumInTempateType1638355123864
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
                        DELETE FROM public.asset_templates where "type" = 'DIVERSITY_CREDITS';
                        DELETE FROM public.asset_templates where "type" = 'STABLE_COINS';
              `);

    await queryRunner.query(`
                        ALTER TABLE public.asset_templates
                        ALTER COLUMN "type" TYPE VARCHAR(255);
                        DROP TYPE IF EXISTS public."asset_templates_type_enum";
                        CREATE TYPE "asset_templates_type_enum" AS ENUM ('PHYSICAL_ASSET', 'OPEN_END_FUND', 'CLOSED_END_FUND', 'SYNDICATED_LOAN', 'FIXED_RATE_BOND', 'CARBON_CREDITS');
                        ALTER TABLE public.asset_templates
                        ALTER COLUMN "type" TYPE public."asset_templates_type_enum" USING ("type"::text::public."asset_templates_type_enum");
              `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
              ALTER TABLE public.asset_templates ALTER COLUMN "type" TYPE VARCHAR(255);
              DROP TYPE IF EXISTS public."asset_templates_type_enum" cascade;
              CREATE TYPE "asset_templates_type_enum" AS ENUM ('PHYSICAL_ASSET', 'OPEN_END_FUND', 'CLOSED_END_FUND', 'SYNDICATED_LOAN', 'FIXED_RATE_BOND', 'CARBON_CREDITS', 'DIVERSITY_CREDITS', 'STABLE_COINS');
              ALTER TABLE public.asset_templates ALTER COLUMN "type" TYPE public."asset_templates_type_enum" USING ("type"::text::public."asset_templates_type_enum");
            `);
  }
}
