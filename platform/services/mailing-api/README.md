# Mailing API

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Run Locally](#run-locally)
  - [Environment Variables](#environment-variables)
- [Tests](#tests)
  - [Unit Tests](#unit-tests)
- [API Documentation](#api-documentation)

## Overview

Mailing API is used to send emails through a mail provider such as MailJet.

## Getting Started

### Run Locally

1.  Obtain a MailJet API key and secret: https://app.mailjet.com/account/apikeys
2.  Copy `.env.sample` to `.env` and update the values as needed
3.  Start the service: `docker-compose up --build`

### Environment Variables

| Name               | Description                       |
| ------------------ | --------------------------------- |
| MAILJET_API_KEY    | API key obtained from MailJet.    |
| MAILJET_API_SECRET | API secret obtained from MailJet. |
| MAIL_FROM_ADDRESS  | MailJet mail sender address.      |

## Tests

### Unit Tests

#### Run all unit tests:

```bash
npm test
```

#### Run all unit tests and calculate coverage:

```bash
npm run test:cov
```

## API Documentation

- [ReDoc](https://convergence-dev.api.codefi.network/mailing/documentation)
