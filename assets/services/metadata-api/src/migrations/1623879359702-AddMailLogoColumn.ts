import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMailLogoColumn1623879359702 implements MigrationInterface {
  name = 'AddMailLogoColumn1623879359702';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "configs" ADD "mailLogo" character varying',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "configs" DROP COLUMN "mailLogo"');
  }
}
