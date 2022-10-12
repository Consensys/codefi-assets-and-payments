import { MigrationInterface, QueryRunner } from 'typeorm'

export class newWalletTypes1640108129264 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adding values to enum within a migration not supported in older versions of postgres. This is a workaround
    await queryRunner.query(
      `ALTER TABLE "wallets" ALTER COLUMN "type" TYPE VARCHAR(255)`,
    )

    await queryRunner.query(`DROP TYPE "wallets_type_enum"`)

    await queryRunner.query(
      `CREATE TYPE "wallets_type_enum" AS ENUM ('INTERNAL_CODEFI_HASHICORP_VAULT', 'INTERNAL_CODEFI_AZURE_VAULT', 'INTERNAL_CODEFI_AWS_VAULT', 'INTERNAL_CLIENT_AZURE_VAULT', 'INTERNAL_CLIENT_AWS_VAULT', 'EXTERNAL_CLIENT_METAMASK', 'EXTERNAL_CLIENT_METAMASK_INSTITUTIONAL', 'EXTERNAL_OTHER')`,
    )

    await queryRunner.query(
      `UPDATE "wallets" SET "type" = 'INTERNAL_CODEFI_HASHICORP_VAULT' WHERE "type" = 'orchestrate'`,
    )

    await queryRunner.query(
      `UPDATE "wallets" SET "type" = 'EXTERNAL_OTHER' WHERE "type" = 'external'`,
    )

    await queryRunner.query(
      `ALTER TABLE "wallets" ALTER COLUMN "type" TYPE "wallets_type_enum" USING ("type"::"wallets_type_enum")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Removing type values is not supported. There are workarounds, but it's not recommended
  }
}
