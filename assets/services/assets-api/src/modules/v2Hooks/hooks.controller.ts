import { Controller, Post, Body, HttpCode, UseFilters } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { HooksService } from './hooks.service';
import { TriggerHookBodyInput } from './hook.dto';
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';

@Controller('v2/hooks')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class HooksController {
  constructor(private readonly hooksService: HooksService) {}

  @Post()
  @HttpCode(200)
  @Protected(false, [])
  // This endpoint is not protected as it's a M2M route.
  // Its protected by a secret (cf. AuthenticationGuard) instead of an access token.
  async triggerHookFunction(@Body() hookBody: TriggerHookBodyInput) {
    try {
      const response = await this.hooksService.triggerHookFunction(
        hookBody.tenantId,
        hookBody.txIdentifier,
        hookBody.txHash,
        hookBody.receipt,
        hookBody.txStatus,
        hookBody.errors,
      );
      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'triggering hook function',
        'triggerHookFunction',
        true,
        500,
      );
    }
  }
}
