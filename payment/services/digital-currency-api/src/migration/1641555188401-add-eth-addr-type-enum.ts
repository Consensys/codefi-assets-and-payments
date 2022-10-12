import { MigrationInterface, QueryRunner } from 'typeorm'

export class addEthAddrTypeEnum1641555188401 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ethereum_address_entity" ALTER COLUMN type TYPE VARCHAR(255)`,
    )

    await queryRunner.query(
      `UPDATE "ethereum_address_entity" SET type = 'INTERNAL_CODEFI_HASHICORP_VAULT' WHERE TYPE = 'orchestrate'`,
    )
    await queryRunner.query(
      `UPDATE "ethereum_address_entity" SET type = 'EXTERNAL_OTHER' WHERE TYPE = 'external'`,
    )

    await queryRunner.query(`DROP TYPE IF EXISTS ethereum_address_type_enum`)

    await queryRunner.query(
      `CREATE TYPE "ethereum_address_type_enum" AS ENUM('INTERNAL_CODEFI_HASHICORP_VAULT', 'INTERNAL_CODEFI_AZURE_VAULT', 'INTERNAL_CODEFI_AWS_VAULT', 'INTERNAL_CLIENT_AZURE_VAULT', 'INTERNAL_CLIENT_AWS_VAULT', 'EXTERNAL_CLIENT_METAMASK', 'EXTERNAL_CLIENT_METAMASK_INSTITUTIONAL', 'EXTERNAL_OTHER')`,
    )

    await queryRunner.query(
      `ALTER TABLE "ethereum_address_entity" ALTER COLUMN type TYPE ethereum_address_type_enum USING (type::ethereum_address_type_enum);`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ethereum_address_entity" ALTER COLUMN type TYPE VARCHAR(255)`,
    )

    await queryRunner.query(
      `UPDATE "ethereum_address_entity" SET type = 'orchestrate' WHERE TYPE = 'INTERNAL_CODEFI_HASHICORP_VAULT'`,
    )
    await queryRunner.query(
      `UPDATE "ethereum_address_entity" SET type = 'external' WHERE TYPE = 'EXTERNAL_OTHER'`,
    )

    await queryRunner.query(`DROP TYPE IF EXISTS ethereum_address_type_enum`)

    await queryRunner.query(
      `CREATE TYPE "ethereum_address_type_enum" AS ENUM('orchestrate', 'external')`,
    )

    await queryRunner.query(
      `ALTER TABLE "ethereum_address_entity" ALTER COLUMN type TYPE ethereum_address_type_enum USING (type::ethereum_address_type_enum);`,
    )
  }
}
