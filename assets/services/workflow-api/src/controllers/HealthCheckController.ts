import { Controller, Get } from '@nestjs/common'

export const HEALTHCHECK_MESSAGE =
  'Codefi Assets Workflow API. Check the Swagger file to learn more about it.'

@Controller()
export class HealthCheckController {
  @Get()
  health(): string {
    return HEALTHCHECK_MESSAGE
  }
}
