# Codefi workflow-api

## Table of Contents
- [Overview](#overview)
   - [Terminology](#terminology)
- [Getting Started](#getting-started)
  - [Run Locally](#run-locally)
  - [Migrations](#migrations)
  - [Environment Variables](#environment-variables)
- [Tests](#tests)
  - [Unit Tests](#unit-tests)
  - [Functional Tests](#functional-tests)
  - [Coverage](#coverage)
- [API Documentation](#api-documentation)


## Overview
Microservice that handles business process management. Namely,

- It store business workflows that list the feasible moves in the predefined universe ( = { states } x { user roles }).
- It manages the advancement on a given workflow.
- It provides the history of transitions for a given advancement.

## Terminology

In the code, a template of business workflow is called `WorkflowTemplate`. An instance of such workflow for a given user and a given tenant is called a `WorkflowInstance`. A `WorkflowTemplate` is made of a list of feasible transitions, each one is a `TransitionTemplate`. Its instanciated counterpart is called `TransitionInstance`. The _history of transitions for a given advancement_ mentionned above can be rephrased as the list of `TransitionInstance` for a given `WorkflowInstance`.


## Getting Started

### Run Locally

 1. Copy `.env.sample` to `.env` and update the values as needed
 2. You can run the project with `docker-compose`, simply running `docker-compose up --build`.

Note that once started the service will not be exposed by default. It will be reachable only through docker compose network. To expose it add a `ports` directive to `assets/services/workflow-api/docker-compose.yml` file.

### Migrations

Everytime a database model is updated, a migration needs to be performed.

This can be done by generating a new migration file in [/src/migrations](./src/migrations) folder, thanks to the following command:

````
npm run typeorm:create NameOfTheMigration
```
Then, complete the file with required migration commands.

Play last migration with following command:
npm run typeorm migration:run

Revert last migration with following command:
npm run typeorm migration:revert
````

### Environment Variables

#### General

| Name | Description |
| ---  | --- |
| PORT | Port on which servise run |
| LOG_LEVEL |Log level override, default is `ebug |
| PORT | Port on which servise run |
| DEFAULT_INITIALIZATION_TENANT_ID | Set initial tenant id (default tenant id is codefi) |

#### Database Variables

| Name | Description |
| ---  | --- |
| POSTGRES_HOST | Databes host |
| POSTGRES_PORT | Database port |
| POSTGRES_USER | Database user |
| POSTGRES_PASSWORD | Database password|
| POSTGRES_DB | Database name |

## Tests

There's two type of tests:

- unit tests
- functional tests

### Unit tests

Running the test suite

```
npm run test
```

### Functional tests

To run this tests we need to have a postgres db up and running first. In order to do that run:

```sh
docker-compose up db-test
```

Then all you need is:

```sh
npm run test:functional
```

### Coverage

To get the test coverage from both functional and unit tests combined run the below script:

```sh
npm run test:cov
```

## API Documentation

- [Swagger](http://localhost:6666/docs) (once started locally)
