# Assets-api Test Plan

## Test structure

All tests can be triggered by `npm` commands.

Tests were splitted into Functional tests and Unit tests.

### Unit tests

In order to run the unit test, just execute in your console terminal.

```
$ npm run test
```

### Functional tests

Functional run against a test server (using [nestjs](https://docs.nestjs.com/fundamentals/testing#end-to-end-testing) createTestingModule and compiling the entire AppModule).

Before running the functional tests it is required to have a local redis instance up and running. To do that execute the following command:

```sh
docker-compose -f test/docker-compose.redis.yml up
```

Once a redis instance is up, the functional tests can finally be executed. There's two distinct ways to run them:

- **Lockdown mode** - all http requests need to be mocked. This is the default testing mode.
- **Record mode** - against Dev environment. This mode should only be used for spinning up new tests

#### Lockdown mode

Lockdown mode is the standard way to run tests. All HTTP requests are mocked.
To run these tests, execute:

```
$ npm run test:functional
```

#### Record mode

This mode allows the tests to actualy be executed against the environment defined in the `setEnvVars.ts` and record the mock requests (the tests will use any mock that was already recorded and will record any request that wasn't previously mocked)

In order to create a test using **Record mode** all you need to do is:

- Add an `.test.functional.env` file within the `/test` directory. This file needs to include a `REAL_TOKEN` env var. You can generate a token for the dev environment using our Postman collection.

```yaml
REAL_TOKEN=<ACCESS TOKEN FOR DEV ENVIRONMENT>
```

- add your actual test - you can check any of the existing examples under `/test/functional` directory.

- on the test file, specify a file where the mocks will be recorded. Example:

```js
const { nockDone } = await nock.back('token-create.json', defaultOptions);
```

Then all that's left to do is to actually run the test on **Record mode**. To do that, execute:

```sh
$ npm run test:functional:record
```

> By running this you will notice that all HTTP mocks will be recorded on the specified json file. Also, for quick bootstrap, we support using snapshot for checking the response body - `expect(resp.body).toMatchSnapshot()`. But please check if the snapshot recorded matches your expecations.

If everything was successfull you can now run the tests in **Lockdown mode** and your test should run successfully.

### Continuous integration tests

Continuous integration (CI) tests are basically both functional and unit tests that are executed by the CI platform.
The following npm scripts were created in order to support those tests:

- test:cov

## Code Coverage

In order to see the code the combined (functional + unit) code report, run the following:

```
$ npm run test:cov
```

The combined report will be generated within coverage/

## Test Tools

- **Jest** https://jestjs.io/
- - It's the testing framework.
- - Library for assertions
- - Library for Stubs and mocks (unit tests).
- - Library for testing coverage reports generation.

- **Nock** https://www.npmjs.com/package/nock
- - Node.js library for HTTP server mocking and expectations (used for functional tests).

- **Supertest** https://www.npmjs.com/package/supertest
- - Library to run tests against HTTP server (used for functional tests).
