import { MigrationInterface, QueryRunner } from 'typeorm';

import { createEnumType } from 'src/utils/migrationUtils';

export class CreateUsersTable1590618742683 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await createEnumType(
      queryRunner,
      '"enum_users_userType"',
      "'SUPERADMIN', 'ADMIN', 'USER', 'VEHICLE', 'NOTARY'",
    );

    await createEnumType(
      queryRunner,
      '"enum_users_userNature"',
      "'NATURAL', 'LEGAL'",
    );

    await createEnumType(
      queryRunner,
      '"enum_users_accessType"',
      "'READWRITE', 'READONLY', 'CUSTOM'",
    );

    await createEnumType(
      queryRunner,
      '"enum_users_prefix"',
      "'Mr', 'Mrs', 'Ms', ''",
    );

    await createEnumType(
      queryRunner,
      '"enum_users_defaultAccountSigType"',
      "'FRONT', 'BACK'",
    );

    await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "public"."users" (
            "userId" uuid NOT NULL,
            "authId" varchar(255),
            "firstConnectionCode" varchar(255),
            "superUserId" varchar(255),
            "userType" "public"."enum_users_userType",
            "userNature" "public"."enum_users_userNature",
            "accessType" "public"."enum_users_accessType",
            "email" varchar(255),
            "phone" varchar(255),
            "prefix" "public"."enum_users_prefix",
            "firstName" varchar(255),
            "lastName" varchar(255),
            "defaultAccountAddress" varchar(255),
            "defaultAccountSigType" "public"."enum_users_defaultAccountSigType",
            "accounts" _json,
            "picture" varchar(255),
            "docuSignId" varchar(255),
            "bankAccountDetail" json,
            "data" json,
            "createdAt" timestamptz NOT NULL,
            "updatedAt" timestamptz NOT NULL,
            PRIMARY KEY ("userId")
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "users"');
  }
}
