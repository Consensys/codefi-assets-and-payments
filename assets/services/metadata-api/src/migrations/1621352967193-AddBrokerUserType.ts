import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBrokerUserType1621352967193 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE public.users
            ALTER COLUMN "userType" TYPE VARCHAR(255);
            DROP TYPE IF EXISTS public."enum_users_userType";
            CREATE TYPE "enum_users_userType" AS ENUM ('SUPERADMIN', 'ADMIN', 'ISSUER', 'UNDERWRITER', 'BROKER', 'INVESTOR', 'VEHICLE', 'NOTARY', 'VERIFIER', 'NAV_MANAGER');
            ALTER TABLE public.users
            ALTER COLUMN "userType" TYPE public."enum_users_userType" USING ("userType"::text::public."enum_users_userType");
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE public.users
            ALTER COLUMN "userType" TYPE VARCHAR(255);
            DROP TYPE IF EXISTS public."enum_users_userType";
            CREATE TYPE "enum_users_userType" AS ENUM ('SUPERADMIN', 'ADMIN', 'ISSUER', 'UNDERWRITER', 'INVESTOR', 'VEHICLE', 'NOTARY', 'VERIFIER', 'NAV_MANAGER');
            ALTER TABLE public.users
            ALTER COLUMN "userType" TYPE public."enum_users_userType" USING ("userType"::text::public."enum_users_userType");
        `);
  }
}
