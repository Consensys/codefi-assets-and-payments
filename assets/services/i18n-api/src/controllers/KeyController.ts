import { Controller, Get, HttpCode, Query } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { ApiTags } from '@nestjs/swagger'

import { KeyService } from '../services/Key.service'

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

@ApiTags('keys')
@Controller('/keys')
export class KeyController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private localeService: KeyService,
  ) {
    logger.setContext(KeyController.name)
  }

  @Get()
  @HttpCode(200)
  async find(@Query('locale') locale = 'en', @Query('filter') filter = '') {
    this.logger.info({ locale, filter }, 'find')
    return await this.localeService.find(locale, filter)
  }
}
