import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTokenDescriptionVarcharSize1620134133632
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE tokens ALTER COLUMN description TYPE varchar(500)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE tokens ALTER COLUMN description TYPE varchar(255)',
    );
  }
}
