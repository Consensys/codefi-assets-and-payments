import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterConfigsAddMailColorColumn1623930508288
  implements MigrationInterface
{
  name = 'AlterConfigsAddMailColorColumn1623930508288';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "configs" ADD "mailColor" character varying',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "configs" DROP COLUMN "mailColor"');
  }
}
