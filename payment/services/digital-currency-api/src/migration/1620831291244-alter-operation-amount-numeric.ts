import { OperationEntity } from '../data/entities/OperationEntity'
import { hexToString, stringToHex } from '../utils/bignumberUtils'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class alterOperationAmountNumeric1620831291244
  implements MigrationInterface
{
  name = 'alterOperationAmountNumeric1620831291244'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // find all operation entities
    const operationEntity: OperationEntity[] = await queryRunner.manager.find(
      OperationEntity,
    )
    console.log(`found operations: ${operationEntity.length}`)

    console.log(`starting hex to string conversion...`)
    // converting hex to string
    const operations = operationEntity.map((op) => ({
      ...op,
      operationAmount: hexToString(op.operationAmount),
    }))
    console.log(`conversion concluded.`)

    // updating operationAmount with new values
    await queryRunner.manager.save(OperationEntity, operations, { chunk: 1000 })

    // alter table
    await queryRunner.manager.query(
      `ALTER TABLE "operation_entity" ALTER COLUMN  "operationAmount" TYPE numeric USING ("operationAmount")::numeric`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ROLLBACK SCRIPT
    // find all operation entities
    const operationEntity: OperationEntity[] = await queryRunner.manager.find(
      OperationEntity,
    )
    console.log(`found operations: ${operationEntity.length}`)

    console.log(`starting string to hex conversion...`)
    // converting hex to string
    const operations = operationEntity.map((op) => ({
      ...op,
      operationAmount: stringToHex(op.operationAmount),
    }))
    console.log(`conversion concluded.`)

    // execute the ROLLBACK
    await queryRunner.manager.query(
      `ALTER TABLE "operation_entity" ALTER COLUMN  "operationAmount" TYPE character varying `,
    )

    // updating operationAmount with new values
    await queryRunner.manager.save(OperationEntity, operations, { chunk: 1000 })
  }
}
