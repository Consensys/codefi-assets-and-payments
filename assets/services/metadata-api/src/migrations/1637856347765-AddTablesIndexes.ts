import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class AddTablesIndexes1637856347765 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      DATABASE_TABLES.ASSET_INSTANCES,
      new TableIndex({
        name: `IX_${DATABASE_TABLES.ASSET_INSTANCES}_tenantId`,
        columnNames: ['tenantId'],
      }),
    );
    await queryRunner.createIndex(
      DATABASE_TABLES.TOKENS,
      new TableIndex({
        name: `IX_${DATABASE_TABLES.TOKENS}_tenantId`,
        columnNames: ['tenantId'],
      }),
    );
    await queryRunner.createIndex(
      DATABASE_TABLES.USERS,
      new TableIndex({
        name: `IX_${DATABASE_TABLES.USERS}_tenantId`,
        columnNames: ['tenantId'],
      }),
    );
    await queryRunner.createIndex(
      DATABASE_TABLES.ASSET_TEMPLATES,
      new TableIndex({
        name: `IX_${DATABASE_TABLES.ASSET_TEMPLATES}_tenantId`,
        columnNames: ['tenantId'],
      }),
    );
    await queryRunner.createIndex(
      DATABASE_TABLES.TOKENS,
      new TableIndex({
        name: `UX_${DATABASE_TABLES.TOKENS}_tenantId_id`,
        columnNames: ['tenantId', 'id'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      DATABASE_TABLES.USERS,
      new TableIndex({
        name: `UX_${DATABASE_TABLES.USERS}_tenantId_id`,
        columnNames: ['tenantId', 'id'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      DATABASE_TABLES.ASSET_TEMPLATES,
      new TableIndex({
        name: `UX_${DATABASE_TABLES.ASSET_TEMPLATES}_tenantId_id`,
        columnNames: ['tenantId', 'id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      DATABASE_TABLES.ASSET_INSTANCES,
      `IX_${DATABASE_TABLES.ASSET_INSTANCES}_tenantId`,
    );
    await queryRunner.dropIndex(
      DATABASE_TABLES.TOKENS,
      `IX_${DATABASE_TABLES.TOKENS}_tenantId`,
    );
    await queryRunner.dropIndex(
      DATABASE_TABLES.USERS,
      `IX_${DATABASE_TABLES.USERS}_tenantId`,
    );
    await queryRunner.dropIndex(
      DATABASE_TABLES.ASSET_TEMPLATES,
      `IX_${DATABASE_TABLES.ASSET_TEMPLATES}_tenantId`,
    );
    await queryRunner.dropIndex(
      DATABASE_TABLES.TOKENS,
      `UX_${DATABASE_TABLES.TOKENS}_tenantId_id`,
    );
    await queryRunner.dropIndex(
      DATABASE_TABLES.USERS,
      `UX_${DATABASE_TABLES.USERS}_tenantId_id`,
    );
    await queryRunner.dropIndex(
      DATABASE_TABLES.ASSET_TEMPLATES,
      `UX_${DATABASE_TABLES.ASSET_TEMPLATES}_tenantId_id`,
    );
  }
}
