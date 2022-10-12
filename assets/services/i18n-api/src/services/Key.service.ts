import { Injectable, OnModuleInit } from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import fs from 'fs'
import { Keys } from '../data/models/Keys'

@Injectable()
export class KeyService implements OnModuleInit {
  /*
   *  {
   *     en: {
   *             hello.world: "Hello World"
   *         }
   *     fr: {
   *             hello.world: "Bonjour le monde"
   *         }
   *  }
   * */
  private locales: {
    [key: string]: Keys
  }
  constructor(private readonly logger: NestJSPinoLogger) {
    logger.setContext(KeyService.name)
  }

  async onModuleInit() {
    this.logger.info(`loading locales...`)
    fs.readdir('./locales/', (err, filenames) => {
      if (err) {
        this.logger.error(`Directory missing because: ${err.message}`)
        throw err
      }
      filenames.forEach((filename) => {
        if (filename !== 'defaults') {
          fs.readFile(`./locales/${filename}`, (err, data) => {
            if (err) {
              this.logger.error(`failed to load locales: ${err.message}`)
              throw err
            }
            try {
              const keys = JSON.parse(data.toString('utf8'))
              const [locale] = filename.split('.')
              this.locales = {
                ...this.locales,
                [locale]: keys,
              }
              this.logger.info(
                `${locale} loaded ${Object.keys(keys).length} keys`,
              )
            } catch (e) {
              this.logger.error(
                `failed to parse locale ${filename}: ${e.message}`,
              )
            }
          })
        }
      })
    })
  }

  async find(locale: string, filter: string): Promise<Keys> {
    this.logger.info({ locale, filter }, 'find')
    const loc = !this.locales[locale]
      ? this.locales['defaults']
      : this.locales[locale]

    return Object.entries(loc).reduce((memo, [key, value]) => {
      if (key.includes(filter)) {
        return {
          ...memo,
          [key]: value,
        }
      }
      return memo
    }, {})
  }
}
