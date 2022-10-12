import { MigrationInterface, QueryRunner, Table } from "typeorm";
export class createItemsTable1646925003855 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "Items",
        columns: [
          { name: "id", type: "uuid", isPrimary: true },
          { name: "tenantId", type: "varchar", length: "255" },
          { name: "content", type: "text" },
          { name: "contentType", type: "varchar", length: "255" },
          { name: "createdAt", type: "timestamptz", default: "now()" },
          { name: "updatedAt", type: "timestamptz", default: "now()" },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("Items", true, true, true);
  }
}
