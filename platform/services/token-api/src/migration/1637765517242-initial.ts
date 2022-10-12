import { MigrationInterface, QueryRunner } from 'typeorm'

export class initial1637765517242 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO
      $$
      BEGIN
        IF NOT EXISTS (SELECT * FROM pg_type typ INNER JOIN pg_namespace nsp ON nsp.oid = typ.typnamespace
                        WHERE nsp.nspname = current_schema() AND typ.typname = 'operation_entity_operation_enum')
        THEN
            CREATE TYPE "operation_entity_operation_enum" AS ENUM
            ('deploy', 'mint', 'burn', 'transfer', 'transferFrom', 'transferOwnership', 'approve', 'setApprovalForAll', 'safeMint', 'safeMintWithData', 'safeTransferFrom', 'safeTransferFromWithData');
        END IF;

        IF NOT EXISTS (SELECT * FROM pg_type typ INNER JOIN pg_namespace nsp ON nsp.oid = typ.typnamespace
            WHERE nsp.nspname = current_schema() AND typ.typname = 'operation_entity_status_enum')
        THEN
            CREATE TYPE "operation_entity_status_enum" AS ENUM
            ('pending', 'confirmed', 'failed');
        END IF;

        IF NOT EXISTS (SELECT * FROM pg_type typ INNER JOIN pg_namespace nsp ON nsp.oid = typ.typnamespace
            WHERE nsp.nspname = current_schema() AND typ.typname = 'token_entity_type_enum')
        THEN
            CREATE TYPE "token_entity_type_enum" AS ENUM
            ('CodefiERC20', 'CodefiERC721', 'Universal', 'DVP');
        END IF;

        IF NOT EXISTS (SELECT * FROM pg_type typ INNER JOIN pg_namespace nsp ON nsp.oid = typ.typnamespace
            WHERE nsp.nspname = current_schema() AND typ.typname = 'token_entity_status_enum')
        THEN
            CREATE TYPE "token_entity_status_enum" AS ENUM
            ('pending', 'confirmed', 'failed');
        END IF;
      END;
      $$
      LANGUAGE plpgsql;`,
    )

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "operation_entity" ("id" character varying NOT NULL, "status" "operation_entity_status_enum" NOT NULL DEFAULT 'pending'::operation_entity_status_enum, "operation" "operation_entity_operation_enum" NOT NULL, "transactionId" character varying NOT NULL, "chainName" character varying NOT NULL, "tenantId" character varying, "entityId" character varying, "createdBy" character varying, "createdAt" timestamp without time zone NOT NULL, "blockNumber" integer, "transactionHash" character varying, "decodedEvent" json, "receipt" json, CONSTRAINT "PK_926dbec3380e83643b464d67817" PRIMARY KEY ("id"))`,
    )

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "token_entity" ("id" character varying NOT NULL, "status" "token_entity_status_enum" NOT NULL DEFAULT 'pending'::token_entity_status_enum, "type" "token_entity_type_enum" NOT NULL, "name" character varying NOT NULL, "symbol" character varying NOT NULL, "chainName" character varying NOT NULL, "decimals" integer, "deployerAddress" character varying NOT NULL, "contractAddress" character varying, "operationId" character varying, "transactionId" character varying, "tenantId" character varying, "entityId" character varying, "createdBy" character varying, "createdAt" timestamp without time zone NOT NULL, CONSTRAINT "PK_687443f2a51af49b5472e2c5ddc" PRIMARY KEY ("id"))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "token_entity"`)
    await queryRunner.query(`DROP TABLE "operation_entity"`)
    await queryRunner.query(`DROP TYPE "token_entity_status_enum"`)
    await queryRunner.query(`DROP TYPE "token_entity_type_enum"`)
    await queryRunner.query(`DROP TYPE "operation_entity_status_enum"`)
    await queryRunner.query(`DROP TYPE "operation_entity_operation_enum"`)
  }
}
