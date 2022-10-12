import { MigrationInterface, QueryRunner } from 'typeorm'

export class walletPk1645006468138 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "PK_f907d5fd09a9d374f1da4e13bd3";`,
    )

    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "PK_f907d5fd09a9d374f1da4e13bd3" PRIMARY KEY ("address", "entityId");`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "PK_f907d5fd09a9d374f1da4e13bd3";`,
    )

    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "PK_f907d5fd09a9d374f1da4e13bd3" PRIMARY KEY ("address");`,
    )
  }
}
