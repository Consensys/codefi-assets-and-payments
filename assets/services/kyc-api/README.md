# KYC-API
## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Run Locally](#run-locally)
  - [Environment Variables](#environment-variables)
- [Tests](#tests)
  - [Unit Tests](#unit-tests)
  - [Functional Tests](#functional-tests)
- [API Documentation](#api-documentation)

## Overview

KYC-API is a micro-service, part of the global Codefi Assets architecture, a technology stack for tokenization of financial assets.

Basically, KYC-API is a module to create custom KYC verification, adapted to issuer's needs.
It allows:

- Issuers to define their KYCTemplate (set of KYCElements that will be requested from the investor), during their onboarding flow.
- Investors to submit their KYC (set of KYCElementInstances), in accordance with the requested elements.
- Issuers to create KYCReviews (either at template level, or at element level), in order to validate/reject submitted KYC.

## Getting Started

### Run Locally

 1. Copy `.env.sample` to `.env` and update the values as needed
 2. Start the service: `docker-compose up --build`

Note that once started the service will not be exposed by default. It will be reachable only through docker compose network. To expose it add a `ports` directive to `assets/services/kyc-api/docker-compose.yml` file.

### Environment Variables

#### Initial Configuration

| Name | Optional | Description |
| ---  | --- | --- |
| PORT | Yes | Service listening port |
| DB_ENABLE | Yes | Choose to enable database usage (Defaults to `true`) |
| POSTGRES_HOST | Yes | KYC-API Database Host |
| POSTGRES_USER | Yes | KYC-API Database Username |
| POSTGRES_PASSWORD | Yes | KYC-API Database Password |
| POSTGRES_DB | Yes | KYC-API Database Name |
| POSTGRES_PORT | Yes | KYC-API Database Port |
| POSTGRES_SSL | Yes | KYC-API Database SSL enabled |

## Tests
### Unit Tests

#### Run all unit tests:

``` bash
npm test:unit
```

## Functional Tests
#### Run all functional tests:

``` bash
npm run test:functional
```

## API Documentation

- [Swagger](http://localhost:3002/docs) (once started locally)
