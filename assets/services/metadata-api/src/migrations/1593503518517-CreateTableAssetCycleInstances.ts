import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';

export class CreateTableAssetCycleInstances1593503518517
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: DATABASE_TABLES.ASSET_CYCLE_INSTANCES,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'assetInstanceId',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'assetInstanceClassKey',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'subscriptionStartDate',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'subscriptionEndDate',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'valuationDate',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'settlementDate',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'unpaidFlagDate',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'nav',
            type: 'numeric',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'NOT_STARTED',
              'SUBSCRIPTION_STARTED',
              'SUBSCRIPTION_ENDED',
              'SETTLED',
              'CLOSED',
            ],
            enumName: 'enum_cycle_status',
            isNullable: false,
          },
          {
            name: 'data',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            isNullable: false,
            default: 'NOW()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            isNullable: false,
            default: 'NOW()',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(DATABASE_TABLES.ASSET_CYCLE_INSTANCES);
  }
}
