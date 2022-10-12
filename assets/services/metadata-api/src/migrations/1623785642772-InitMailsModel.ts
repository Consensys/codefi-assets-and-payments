import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitMailsModel1623785642772 implements MigrationInterface {
  name = 'InitMailsModel1623785642772';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "mail_variables" ("key" character varying NOT NULL, "variables" text array NOT NULL, CONSTRAINT "PK_db1b706084207b20807b6c35e3d" PRIMARY KEY ("key"))',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UX_mail_variables_key" ON "mail_variables" ("key")',
    );
    await queryRunner.query(
      'CREATE TABLE "mails" ("id" uuid NOT NULL, "tenantId" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "key" character varying NOT NULL, "subject" character varying NOT NULL, "messageTitle" text, "message" text NOT NULL, "buttonLabel" text, "variablesKey" character varying NOT NULL, CONSTRAINT "REL_57fb691129d426ae97f84d58de" UNIQUE ("variablesKey"), CONSTRAINT "PK_218248d7dfe1b739f06e2309349" PRIMARY KEY ("id"))',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UX_mails_tenantId_key" ON "mails" ("tenantId", "key")',
    );
    await queryRunner.query(
      'ALTER TABLE "mails" ADD CONSTRAINT "FK_57fb691129d426ae97f84d58de2" FOREIGN KEY ("variablesKey") REFERENCES "mail_variables"("key") ON DELETE NO ACTION ON UPDATE NO ACTION',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "mails" DROP CONSTRAINT "FK_57fb691129d426ae97f84d58de2"',
    );
    await queryRunner.query('DROP INDEX "UX_mails_tenantId_key"');
    await queryRunner.query('DROP TABLE "mails"');
    await queryRunner.query('DROP INDEX "UX_mail_variables_key"');
    await queryRunner.query('DROP TABLE "mail_variables"');
  }
}
