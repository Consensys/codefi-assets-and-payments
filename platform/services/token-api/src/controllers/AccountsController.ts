import { Controller, HttpCode, Post, Req, UseFilters } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiTags } from '@nestjs/swagger'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { Protected, extractTokenFromRequest } from '@codefi-assets-and-payments/auth'
import { Request } from 'express'
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler'

import { OrchestrateAccountsService } from '@codefi-assets-and-payments/nestjs-orchestrate'

@ApiTags('Accounts')
@Controller('accounts')
@UseFilters(new AppToHttpFilter())
export class AccountsController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly orchestrateAccountsService: OrchestrateAccountsService,
  ) {
    logger.setContext(AccountsController.name)
  }

  @Post()
  @HttpCode(201)
  @Protected(true, ['update:entity'])
  @ApiOAuth2(['update:entity'])
  @ApiOperation({ summary: 'Create a new account' })
  async createAccount(@Req() req: Request): Promise<string> {
    const authToken: string = extractTokenFromRequest(req)

    const account: string =
      await this.orchestrateAccountsService.generateAccount(authToken)
    this.logger.info({ account }, 'Creating new account')

    return account
  }
}
