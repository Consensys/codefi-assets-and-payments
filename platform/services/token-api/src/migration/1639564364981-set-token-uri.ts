import { MigrationInterface, QueryRunner } from 'typeorm'

export class settokenuri1639564364981 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adding values to enum within a migration not supported in older versions of postgres. This is a workaround
    await queryRunner.query(
      `ALTER TABLE "operation_entity" ALTER COLUMN "operation" TYPE VARCHAR(255)`,
    )

    await queryRunner.query(`DROP TYPE "operation_entity_operation_enum"`)

    await queryRunner.query(
      `CREATE TYPE "operation_entity_operation_enum" AS ENUM ('deploy', 'register', 'mint', 'burn', 'transfer', 'transferFrom', 'transferOwnership', 'approve', 'setApprovalForAll', 'safeMint', 'safeMintWithData', 'safeTransferFrom', 'safeTransferFromWithData', 'setTokenURI')`,
    )

    await queryRunner.query(
      `ALTER TABLE "operation_entity" ALTER COLUMN "operation" TYPE "operation_entity_operation_enum" USING ("operation"::"operation_entity_operation_enum")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Removing type values is not supported. There are workarounds, but it's not recommended
  }
}
