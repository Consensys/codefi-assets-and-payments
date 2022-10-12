import { DynamicModule, Global, Module } from '@nestjs/common'
import { apm } from '../apm'
import { createLogger } from '../logging'

export const APM_CLIENT_PROVIDER = 'Apm client provider'
const logger = createLogger('APM')

@Global()
@Module({})
export class ApmClientModule {
  static forRoot(apmAgent: apm.Agent): DynamicModule {
    const providers = [
      {
        provide: APM_CLIENT_PROVIDER,
        useFactory: () => {
          logger.info('Setting up APM Agent in NestJS Module')
          return apmAgent
        },
      },
    ]
    return {
      module: ApmClientModule,
      providers: providers,
      exports: providers,
    }
  }
}
