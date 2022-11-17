import { Controller, Post, HttpCode, Body } from '@nestjs/common'
import { AuthHookRegisterRequest } from '../requests/AuthHookRegisterRequest'
import { WebHookService } from '../services/WebHookService'
import { AuthHookRegisterResponse } from '../responses/AuthHookRegisterResponse'
import { Permissions } from '../guards/PermissionsDecorator'
import {
  ApiTags,
  ApiOAuth2,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { Protected } from '@codefi-assets-and-payments/auth'

@ApiTags('Hooks')
@ApiBearerAuth('access-token')
@Controller('auth/hook')
export class WebHookController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly webHookService: WebHookService,
  ) {
    logger.setContext(WebHookController.name)
  }

  @Post('register')
  @HttpCode(200)
  @Permissions('register:hook')
  @ApiOAuth2(['register:hook'])
  @ApiOperation({ summary: 'Register a new hook' })
  @Protected(true, [])
  async authHook(
    @Body() authRegisterRequest: AuthHookRegisterRequest,
  ): Promise<AuthHookRegisterResponse> {
    this.logger.info(`authHook. request: %o`, authRegisterRequest)
    const serviceResponse =
      await this.webHookService.processAuthRegisterWebHook(authRegisterRequest)
    return {
      registered: serviceResponse,
    }
  }
}
