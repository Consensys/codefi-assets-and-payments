import { MigrationInterface, QueryRunner } from 'typeorm'
import { getChecksumAddress } from '../utils/utils'

export class checksumAddresses1642080784657 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.applyChecksumToField(
      queryRunner,
      'wallets',
      'address',
      'address',
    )
    await this.applyChecksumToField(
      queryRunner,
      'entities',
      'defaultWallet',
      'id',
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cannot revert as not possible to know previous address format
  }

  private async applyChecksumToField(
    queryRunner: QueryRunner,
    table: string,
    field: string,
    keyField: string,
  ) {
    const records = await queryRunner.query(`SELECT * FROM ${table}`)

    for (const record of records) {
      const originalAddress = record[field]
      const checksumAddress = getChecksumAddress(originalAddress)
      const addressNotChecksum = checksumAddress !== originalAddress

      if (addressNotChecksum) {
        await queryRunner.query(
          `UPDATE "${table}" SET "${field}" = $1 WHERE "${keyField}" = $2`,
          [
            checksumAddress ? checksumAddress : originalAddress,
            record[keyField],
          ],
        )
      }
    }
  }
}
