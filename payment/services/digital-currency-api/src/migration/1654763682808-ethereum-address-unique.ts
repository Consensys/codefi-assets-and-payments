import { MigrationInterface, QueryRunner } from 'typeorm'

export class ethereumAddressUnique1654763682808 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "ethereum_address_entity" WHERE id IN (
                SELECT id
                FROM
                (SELECT id,
                    ROW_NUMBER() OVER( PARTITION BY address,
                    "entityId", type
                   ORDER BY  id ) AS row_num
                   FROM "ethereum_address_entity" ) t
                   WHERE t.row_num > 1 )`,
    )

    await queryRunner.query(
      `ALTER TABLE ethereum_address_entity
            ADD CONSTRAINT "UQ_entityId_address_type" UNIQUE ("entityId", address, type)`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ethereum_address_entity"
                DROP CONSTRAINT "UQ_entityId_address_type"`,
    )
  }
}
