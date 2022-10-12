import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMails1623875137716 implements MigrationInterface {
  name = 'UpdateMails1623875137716';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "mails" DROP CONSTRAINT "FK_57fb691129d426ae97f84d58de2"',
    );
    await queryRunner.query(
      'ALTER TABLE "mails" DROP CONSTRAINT "REL_57fb691129d426ae97f84d58de"',
    );
    await queryRunner.query(
      'ALTER TABLE "mails" ADD CONSTRAINT "FK_57fb691129d426ae97f84d58de2" FOREIGN KEY ("variablesKey") REFERENCES "mail_variables"("key") ON DELETE NO ACTION ON UPDATE NO ACTION',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "mails" DROP CONSTRAINT "FK_57fb691129d426ae97f84d58de2"',
    );
    await queryRunner.query(
      'ALTER TABLE "mails" ADD CONSTRAINT "REL_57fb691129d426ae97f84d58de" UNIQUE ("variablesKey")',
    );
    await queryRunner.query(
      'ALTER TABLE "mails" ADD CONSTRAINT "FK_57fb691129d426ae97f84d58de2" FOREIGN KEY ("variablesKey") REFERENCES "mail_variables"("key") ON DELETE NO ACTION ON UPDATE NO ACTION',
    );
  }
}
