# @codefi-assets-and-payments/error-handler

This package aims to unify and align the approach of Error & Logging across Codefi groups and Customer & Success. It also has wrapper of common exceptions of NestJS and a central place to our filters.
To know more about Error Management please access: [Logging & Error Confluence Page](https://consensysteam.atlassian.net/wiki/spaces/PRDC/pages/695436747/Monitoring+Logging+and+Alerting)

## Install

```bash
npm install --save @codefi-assets-and-payments/error-handler
```

## BaseExceptions

There is a set of predefined exceptions that should be thrown by business logic services in a generic way instead of using `nestJS` HTTP exceptions.
We may have services that are not used in the context of an HTTP request, or that are used in several contexts (HTTP request, messaging command coming from kafka, background job, etc), so we need to throw generic non HTTP specific errors, but at the same time, when we are in the HTTP context, we want to map those errors to HTTP codes.

Currently available exceptions:

* `DatabaseConnectionException`: (503)
* `MessagingConnectionException`: (503)
* `ValidationException` : Equivalent to an unprocessable HTTP error (422)
* `EntityNotFoundException`: Equivalent to a resource not found (404)
* `ConfigurationException`: Bad configuration error (500)

All of them extend from `BaseException`, that is the exception that should be used for application errors.

Thanks to `AppToHttpFilter`, we can annotate our controllers with `@UseFilters(new AppToHttpFilter())`, and those exceptions will be mapped to HTTP responses automatically **only** where we need it.

## Create a new Exception

1. Create a new class extending `BaseException`.
2. If necessary create the `errorCode` at `src/enums/ErrorCodeEnum.ts`
3. The `errorName` should be microservice specific however this package also provides a set of common exceptions in this scenario also include the `errorName` at `src/enums/ErrorNameEnum.ts`
3. Edit `AppToHttpFilter` to map the exception to an HTTP response if it makes sense.
**4. Document the new exception. [HERE](https://consensysteam.atlassian.net/wiki/spaces/PRDC/pages/851149243/Error+Documentation+-+Customer+Success)**

### Example

```Javascript
// Exception
import { BaseException, ErrorCode } from '@codefi-assets-and-payments/error-handler'

export class ExampleException extends BaseException {
  constructor(message: string, payload: object) {
    super(ErrorCode.EAPP01, ErrorName.ExampleException, message, payload)
  }
}

// Test
try {
  throw new Error('local custom exception')
} catch (e) {
  const error = new ExampleException('example exception', {
    message: e.message,
    stacktrace: 'stacktrace additional info',
    roleId,
  })
  this.logger.error(
    error,
    'exception extended by BaseException from error-handler package',
  )
}

```

```bash
# Output
{"log":{"level":"error","logger":"pino"},"@timestamp":"2020-07-14T13:03:31.466Z","module":"nestjs","context":"ErrorController","errorCode":"EEXA01","errorName":"ExampleException","payload":{ "message": "example exception", "stacktrace": "stacktrace additional info","roleId":"roleIdExample"},"ecs":{"version":"1.5.0"},"message":"exception extended by BaseException from error-handler package"}

```

### Name convention `errorCode`
Create new `errorCode` in case doesn't exist or when necessary increase the granularity e.g. `Database = 'EDAT01'` -> `DatabaseConnection = 'EDAT02'`.
```bash
// EDAT01
E = error
DAT = refers to where the error happened
01 = incremental number
```

### Contributions
Open a PR to include a new set of common errors, errorCode or also to improve the package. Contributions are very welcome.