# Cofidocs-API
## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Run Locally](#run-locally)
  - [Environment Variables](#environment-variables)
- [Tests](#tests)
  - [Unit Tests](#unit-tests)
  - [Functional Tests](#functional-tests)
- [API Documentation](#api-documentation)

## Overview

Cofidocs-API is a micro-service, part of the global Codefi Assets architecture, a technology stack for tokenization of financial assets.

Cofidocs-API is a service that can be used to upload documents to AWS S3.

## Getting Started

### Prerequisites

Cofidocs-API needs a configured S3 bucket and an AWS Key-Secret pair with read/write permissions to the bucket. 

Once you have your AWS Key pair (along with the Bucket name), you can fill the [environment variables](#environment-variables).

### Run Locally

 1. Copy `.env.sample` to `.env` and update the values as needed
 2. Start the service: `docker-compose up --build`

Note that once started the service will not be exposed by default. It will be reachable only through docker compose network. To expose it add a `ports` directive to `assets/services/cofidocs-api/docker-compose.yml` file.

### Environment Variables

#### **AWS S3 Bucket**

| Name | Optional | Description |
| ---  | --- | --- |
| AWS_REGION | No | AWS S3 Bucket region |
| AWS_S3_BUCKET_NAME | No | AWS S3 Bucket name |
| AWS_ACCESS_KEY_ID | No | AWS IAM Key |
| AWS_SECRET_ACCESS_KEY | No | AWS IAM Secret |

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
