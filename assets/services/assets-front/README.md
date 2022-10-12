# Codefi assets-front

## Table of Contents
- [Overview](#overview)
   - [Terminology](#terminology)
- [Getting Started](#getting-started)
  - [Run Locally](#run-locally)
  - [Extract translations](#extract-translations)
  - [Environment Variables](#environment-variables)

## Overview

This is ui for assets project. It is bootstraped with [create-react-appc](https://reactjs.org/docs/create-a-new-react-app.html#create-react-app).

## Getting started

### Run Locally

#### `yarn start`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

#### `yarn start:secure`

Can be called with 2 additional optional parameters for URL and PORT.
example: yarn start:secure development-local.assets.codefi.network 3000

Runs the app in the development mode using an SSL connection
Open [https://development-local.assets.codefi.network:3000/issuer](https://development-local.assets.codefi.network:3000) to view it in the browser.

This is required to test the multi tenancy because Auth0 lib requires a [secure origin](https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin)

To create a SSL certificate in locale to the below steps:

- `brew install mkcert` - only first time.
- `brew install nss` - only first time.
- `sudo yarn start:secure` and fallow steps.

## Extract translations
### `yarn intl:extract`

Extracts default translation keys from project to `defaults-keys.json`. When key's are extracted they should be copied to `i18n-api` repository to `default.json` file..

IMPORTANT: To get new keys available on i18n-api, extract muste be triggered
trough [phrase app](https://help.phrase.com/help/downloading-localization-files). Exported files should be copied to `asset/services/i18n-api/locales`.

For adding new language check `i18n-api` readme.

### Environment Variables

| Name | Description |
| ---  | --- |
| REACT_APP_AUTH_CLIENT_ID | Auth0 client id |
| REACT_APP_AUTH_DOMAIN |Auth0 domain |
| REACT_APP_AUTH_AUDIENCE | Auth0 audience |
| REACT_APP_DOMAIN_NAME | assets-api domain name |
|REACT_APP_APP_URL| assets-api url|
