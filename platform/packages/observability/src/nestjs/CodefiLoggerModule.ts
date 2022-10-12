import { Module, DynamicModule } from '@nestjs/common'
import { LoggerModule, Params } from 'nestjs-pino'

import config from '../config'

@Module({})
export class CodefiLoggerModule {
  static forRoot(moduleConfig?: Params): DynamicModule {
    const { pinoHttp, ...extraModuleConfig } = moduleConfig || { pinoHttp: {} }
    return {
      module: CodefiLoggerModule,
      imports: [
        LoggerModule.forRoot({
          pinoHttp: {
            level: config().logLevel,
            transport: config().logPretty
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    levelFirst: true,
                    translateTime: 'UTC:dd/mm/yyyy, h:MM:ss TT Z',
                  },
                }
              : undefined,
            ...pinoHttp,
          },
          ...extraModuleConfig,
        }),
      ],
      exports: [LoggerModule],
    }
  }
}
