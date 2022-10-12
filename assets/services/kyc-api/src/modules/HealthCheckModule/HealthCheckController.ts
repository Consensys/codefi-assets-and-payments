import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('healthcheck')
@ApiTags('healthcheck')
export class HealthCheckController {
  @Get()
  health(): string {
    return 'Codefi API KYC4. Check the swagger file to learn more about it';
  }
}
