# Metadata-Api Test Plan

## Test structure

All tests can be triggered by `npm` commands.

This project does not have any Unit tests and rely 100% on functional tests.

### Functional tests

Functional run against a test server (using [nestjs](https://docs.nestjs.com/fundamentals/testing#end-to-end-testing) createTestingModule and compiling the entire AppModule and passing it to a [supertest](https://www.npmjs.com/package/supertest) instance.

Before running the functional tests it is required to have a local postgres db instance up and running. To do that execute the following command:

```sh
docker-compose -f tests/docker-compose.functional.yml up
```

Once the postgres instance is up, the functional tests can finally be executed.

All tests are executed in some sort of **Lockdown mode**.

#### Lockdown mode

Lockdown mode is the standard way to run functional tests. This means that no HTTP requests need to be properly mocked (using [nock](https://www.npmjs.com/package/nock)).
To run these tests, execute:

```
$ npm run test:functional
```

### Continuous integration tests

Continuous integration (CI) tests are basically both functional and unit tests that are executed by the CI platform.
The following npm scripts were created in order to support those tests:

- test:cov

Moreover when running on the CI, the CI itself will boot a kafka instance prior to running the tests.
Currently we are relying on Gitlab CI and you can find the configuration as `test:unit` stage (the naming is not the best, but stayed that way for legacy reasons. To be changed in the future).

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
