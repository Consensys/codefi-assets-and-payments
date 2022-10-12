import { WalletType } from '@codefi-assets-and-payments/ts-types'
import { Injectable } from '@nestjs/common'
import fs from 'fs'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import config from '../config'

@Injectable()
export class StoreConfigService {
  constructor(private readonly logger: NestJSPinoLogger) {
    logger.setContext(StoreConfigService.name)
  }

  async get(): Promise<{ [storeId: string]: WalletType }> {
    const storeEnv = config().stores

    if (storeEnv) {
      try {
        const stores = JSON.parse(storeEnv)

        this.logger.info(
          `Loading store config from env - Stores: ${JSON.stringify(stores)}`,
        )

        return stores
      } catch (error) {
        this.logger.info(`Could not parse store config from env`)
      }
    }

    const storeFile = config().storesFile

    try {
      const rawFile = await fs.promises.readFile(storeFile)
      const stores = JSON.parse(rawFile.toString())

      this.logger.info(
        `Success reading store config - File: ${storeFile} | Stores: ${JSON.stringify(
          stores,
        )}`,
      )

      return stores
    } catch (error) {
      this.logger.info(
        `Could not read store config - File: ${storeFile} | Error: ${error.message}`,
      )

      return {}
    }
  }
}
