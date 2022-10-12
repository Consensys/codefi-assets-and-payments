import { Protected } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';
import { Controller, Get, HttpCode, UseFilters } from '@nestjs/common';

@Controller('healthcheck')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class HealthCheckController {
  @Get()
  @HttpCode(200)
  @Protected(false, [])
  // This endpoint is not protected
  async health(): Promise<string> {
    return 'OK';
  }
}
