import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableAssetTemplateAddCategory1644858988398
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."asset_templates_category_enum" AS ENUM ('FUNGIBLE', 'NONFUNGIBLE', 'HYBRID');`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."asset_templates" ADD COLUMN "category" "public"."asset_templates_category_enum" NOT NULL DEFAULT 'HYBRID';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "public"."asset_templates" DROP COLUMN "category";`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."asset_templates_category_enum";`,
    );
  }
}
