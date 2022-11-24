# @consensys/observability

All-in-one Observability package for NodeJS services.

## Install

Run the following command to install this package:

```shell script
npm install @consensys/observability
```

## Usage

**tl;dr** :

```typescript
import { createLogger, initApm } from '@consensys/observability'

initApm()

const logger = createLogger('main')

logger.info({ hello: 'world' }, 'My first log message')
```

## Usage with NestJS

This is only required if support for `ApmService` is needed to enable traces for kafka messages and orchestrate. Otherwise refer to the `tl;dr` section.

Given that `initApm()` needs to be invoked before any other NestJS modules are loaded and can only be called once. It is necessary to call `initApm()` within the root `AppModule.ts` file like this.

```typescript
import { ApmClientModule, initApm } from '@consensys/observability'

const apm = initApm()

@Module({
  imports: [
    ApmClientModule.forRoot(apm),
    ...
  ],
  ...
})
export class AppModule {}
```

`ApmClientModule` is a global module, so it only needs to be initialised once. `ApmModule` will then be able to resolve the dependencies.

## Detailed usage

### Configuration

Check the `.env.sample` file for a complete list or required environment variables.

### Elastic APM

To enable APM this should be the first two lines ran by an application:

```typescript
import { initApm } from '@consensys/observability'
initApm()
```

If APM is enabled, generated logs will include APM transaction and trace IDs.

### NestJS logger (NestJS8 and up)

To enable configured logger available for NestJS components add the following to the root module of the application:

```typescript
import { Module } from '@nestjs/common'
import { CodefiLoggerModule } from '@consensys/observability'

@Module({
  imports: [CodefiLoggerModule.forRoot()],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### NestJS logger LEGACY (Up to NestJS7)

To enable configured logger available for NestJS components add the following to the root module of the application:

```typescript
import { Module } from '@nestjs/common'
import { LoggerModule } from 'nestjs-pino'
import { nestjsLoggerModuleConfig } from '@consensys/observability'

@Module({
  imports: [LoggerModule.forRoot(nestjsLoggerModuleConfig())],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

To ensure that NestJS is using pino logger to log its internal debug messages we should pass it when we create a Nest application:

```typescript
import { nestjsLogger } from '@consensys/observability'

await NestFactory.create(AppModule, {
  logger: nestjsLogger(),
})
```

With this Nest will be logging with the same configuration and format as the rest of the application.

### NestJS logger injection
This is the standard logger way recommended by nestjs-pino and idiomatic for NestJS8+.
```typescript
// NestJS standard built-in logger.
// Logs will be produced by pino internally
import { Logger } from '@nestjs/common';

export class MyService {
  private readonly logger = new Logger(MyService.name);
  foo() {
    // All logger methods have args format the same as pino, but pino methods
    // `trace` and `info` are mapped to `verbose` and `log` to satisfy
    // `LoggerService` interface of NestJS:
    this.logger.verbose({ foo: 'bar' }, 'baz %s', 'qux');
    this.logger.debug('foo %s %o', 'bar', { baz: 'qux' });
    this.logger.log('foo');
  }
}
```

This is the legacy way of doing it. It will still work:

```typescript
import { Body, Controller, Post } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { InjectPinoLogger } from 'nestjs-pino/dist'

@Controller('controller')
export class MyController {
  constructor(
    @InjectPinoLogger(MyController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Post('path')
  async examplePost(@Body() request: any) {
    this.logger.info('Received ', {
      request,
    })
  }
}
```

More details in the [package page](https://www.npmjs.com/package/nestjs-pino).

### Express logger

```typescript
import { createLogger, expressLogger } from './src'

const express = require('express')
const app = express()

const logger = createLogger('main')

// Optional : use express-pino-logger for Express req/res logging
app.use(expressLogger())

app.get('/', (req, res) => {
  req.log.info(
    {
      path: '/',
    },
    'Processing request',
  )
  res.send('Hello World!')
})

logger.error(new Error('Error message'), 'Test error message')

app.listen(port, () =>
  logger.info(`Example app listening at http://localhost:${port}`),
)
```


### Vanilla logger

If you need to log messages outside Nest framework or provide a logger instance to another library/framework we can get a configured logger instance:

```typescript
import { createLogger } from '@consensys/observability'
import { startServer } from './server'

// Get configured logger instance
const logger = createLogger('main')

startServer().catch(e => {
  logger.error('Failed to start NestJS server: ', e)
})
```

It will use the same logging configuration as the rest of the application.

## Logs example

Here is an example of pretty-printed logs.

```
["2020-06-03T13:14:47.520Z"] INFO : Starting APM
    ecs: {
      "version": "1.5.0"
    }
    module: "APM"
["2020-06-03T13:14:47.529Z"] INFO : Started APM
    ecs: {
      "version": "1.5.0"
    }
    module: "APM"
["2020-06-03T13:14:47.647Z"] INFO : Example app listening at http://localhost:3000
    ecs: {
      "version": "1.5.0"
    }
    module: "test"
^C
```

Pretty-printed format is only used in the development environment.

Here is an example of the same JSON formatted logs in all other environments:

```
{"log":{"level":"info","logger":"pino"},"@timestamp":"2020-06-03T13:14:55.414Z","module":"APM","ecs":{"version":"1.5.0"},"message":"Starting APM"}
{"log":{"level":"info","logger":"pino"},"@timestamp":"2020-06-03T13:14:55.455Z","module":"APM","ecs":{"version":"1.5.0"},"message":"Started APM"}
{"log":{"level":"info","logger":"pino"},"@timestamp":"2020-06-03T13:14:55.552Z","module":"test","ecs":{"version":"1.5.0"},"message":"Example app listening at http://localhost:3000"}
```

# Demo

To run an example in this package run the following command:

```shell script
npm run example
# To see production rendering
NODE_ENV=production npm run example
```
