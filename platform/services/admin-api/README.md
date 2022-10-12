# Admin API
## Table of Contents
- [Admin API](#admin-api)
  - [Table of Contents](#table-of-contents)
  - [- API Documentation](#--api-documentation)
  - [Overview](#overview)
  - [Getting Started](#getting-started)
    - [How to launch locally](#how-to-launch-locally)
    - [Environment Variables](#environment-variables)
      - [Container](#container)
      - [Kafka](#kafka)
      - [@codefi-assets-and-payments/auth](#codefi-assets-and-paymentsauth)
      - [Auth0 Actions](#auth0-actions)
      - [Initial Configuration](#initial-configuration)
      - [Auth0 Tenant](#auth0-tenant)
      - [Infura Connection](#infura-connection)
      - [CORS](#cors)
  - [Tests](#tests)
    - [Unit Tests](#unit-tests)
    - [Integration Tests](#integration-tests)
  - [API Documentation](#api-documentation)
---
## Overview
Admin-API is for creating and managing resources in Auth0, including client applications, users, roles & permissions.
## Getting Started
We highly suggest you to run Admin-API on your personal tenant on Auth0 account. You can follow the steps to create your personal tenant.
1) Create a new tenant on Auth0.
    1) Login to the development Auth0 tenant, named codefi.
    2) Top Left Dropdown > Create tenant
        - Tenant Domain: [FirstName-LastName]
        - Region: [Closest]
        - Environment Tag: Development
        - Create Under: Custom Agreement
2) Create an application to communicate with the Auth0 tenant from the admin API.
    1) Sidebar > Applications > Applications > Create Application
        - Name: Admin API Client
        - Application Type: Machine to Machine Applications
        - API: Auth0 Management API
        - Permissions: Select All
3) Connect admin-api to the tenant by updating the following variables in .env: <br/>
Assuming the tenant domain is **firstname-lastname** and the region is Europe:
```
AUTH0_URL=https://firstname-lastname.eu.auth0.com/
CLIENT_ID=[Admin API Client ID]
CLIENT_SECRET=[Admin API Client Secret]
PERFORM_INITIAL_CONFIGURATION=true
```
In order to verify the creation works, you can run [integration tests](#integration-tests) and expect them to pass. 
### How to launch locally
 1. Install and run [local-dev-env](https://gitlab.com/ConsenSys/codefi/common/local-dev-env) locally
 2. Duplicate `.env.sample` to `.env` and fill out the values. ([Environment Variables](#enviroment-variables))
 3. Then launch application with `docker-compose up --build`
### Environment Variables
#### Container
| Env | Description |
| ---  | --- |
| PORT | The port on which the application will be listening. |
| NODE_ENV | The environment in which the application will be running. |
| LOG_LEVEL | The level of logging to be used. |
| LOG_PRETTY_PRINT | Whether to pretty print the logs. |

#### Kafka 
| Env | Description |
| ---  | --- |
| KAFKA_ENABLE | Whether to use Kafka or not. |
| KAFKA_GROUP_ID | The group id to use for Kafka. |
| SCHEMA_REGISTRY_HOST | The host of the schema registry. |
| KAFKA_BROKER | The host of the Kafka broker. |
| EXPORT_DOCS | Whether to export an Open API spec file to disk for generation of a docs site. |

#### @codefi-assets-and-payments/auth
Following environment variables used by @codefi-assets-and-payments/auth.
| Env | Description |
| ---  | --- |
| M2M_TOKEN_REDIS_HOST | Redis host to be used for storing M2M tokens. |
| M2M_TOKEN_REDIS_PASS | Redis password to be used for storing M2M tokens. |
| AUTH_CUSTOM_NAMESPACE | TBD |

#### Auth0 Actions
| Env | Description |
| ---  | --- |
| URL_ENVIRONMENT | URL to be used to craft for USER_REGISTRATION_CALLBACK_URL |
| M2M_RATE_LIMIT_MAX_ATTEMPTS | Maximum number of attempts to register a m2m token |
| M2M_RATE_LIMIT_ATTEMPT_PERIOD_IN_SECONDS | Period of time in seconds to count the number of attempts to register a m2m token |
| M2M_RATE_LIMIT_REDIS_HOST | Redis host to be used to store the rate limit counters |
| M2M_RATE_LIMIT_REDIS_PASS | Redis password to be used to store the rate limit counters |
| DISABLE_RATE_LIMIT_TENANTS | Comma separated list of tenants to disable rate limiting |
| ENTITIY_API_URL | Entity API URL to be called within Infura user registration callback |

#### Initial Configuration
| Env | Description |
| ---  | --- |
| PERFORM_INITIAL_CONFIGURATION | Whether to perform initial configuration or not |
| STACK_ADMIN_USER_EMAIL | Email of the stack admin user |
| STACK_ADMIN_USER_PASSWORD | Password of the stack admin user |
| STACK_ADMIN_TENANT_ID | Tenant ID of the stack admin user |
| STACK_ADMIN_ENTITY_ID | Entity ID of the stack admin user |
| EMAIL_PROVIDER_API_KEY | Email provider API key ([1Password Vault](https://my.1password.com/vaults/7tlhq5n5rekqznutirr6dw5j7i/allitems/ul7n24okymp4vuq7pmlweo54wm)) |

#### Auth0 Tenant
| Env | Description |
| ---  | --- |
| AUTH0_URL | Auth0 tenant URL |
| CLIENT_ID | Auth0 Management client ID |
| CLIENT_SECRET | Auth0 Management client secret |

#### Infura Connection
| Env | Description |
| ---  | --- |
| INFURA_CONNECTION_CLIENT_ID | Infura connection client ID ([1Password Vault](https://start.1password.com/open/i?a=UK7Z754AFNEPHMSZTG43EODT3A&v=udqbp5l7qwjgr4tm3xpku7tmwy&i=je3a5wiyyjcezo2ptfz3bnwrvq&h=consensys.1password.com)) |
| INFURA_CONNECTION_CLIENT_SECRET | Infura connection client secret ([1Password Vault](https://start.1password.com/open/i?a=UK7Z754AFNEPHMSZTG43EODT3A&v=udqbp5l7qwjgr4tm3xpku7tmwy&i=je3a5wiyyjcezo2ptfz3bnwrvq&h=consensys.1password.com)) |

#### CORS
| Env | Description |
| ---  | --- |
| CORS_ENABLED | Whether to enable CORS or not |
| CORS_ORIGIN | CORS origin in Regex format |

## Tests
### Unit Tests
1. `npm install` to install dependencies first.
2. `npm run test` to run unit tests <br/>
Alternatively you can run `npm run test:cov` to see test coverage.
### Integration Tests
1. Install and run [local-dev-env](https://gitlab.com/ConsenSys/codefi/common/local-dev-env) locally
2. Launch admin-api with `docker-compose up --build`
3. Run integration tests with 
```bash
docker exec admin-api-ms-1 npm run test:integration
```
Alternatively you can use
```bash
docker exec admin-api-ms-1 npm run test:integration:<TEST-NAME>
```
command to run specific integration test.

## API Documentation

- [Postman](https://documenter.getpostman.com/view/5733481/UVC8BR34)
- [Redocs](https://convergence-dev.api.codefi.network/admin/documentation)
