# Codefi Assets i18n API

## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Run Locally](#run-locally)
  - [Adding new language](#adding-new-language)

## Overview

`i18n-api` is internationalization service that provide translations for assets-front.

## Getting Started

### Run Locally

 1. Copy `.env.sample` to `.env` and update the values as needed
 2. You can run the project with `docker-compose`, simply running `docker-compose up --build`.

Note that once started the service will not be exposed by default. It will be reachable only through docker compose network. To expose it add a `ports` directive to `assets/services/i18n-api/docker-compose.yml` file.

### Adding new language

To add new lanaguage go to `https://app.phrase.com/accounts/matthieu-bouchaud/projects/codefi-assets/locales` and click on `+ Add Language` button.
Name of the language is not used, set something relevant like: English, Japanese, etc...
What is important, as it is used as identifier is the **Language Code**, it has to be **unique**.
Add new langauge to `.phrase.yml`, and merge to master.
Set up [github sync](https://help.phrase.com/help/github-sync)
On `https://app.phrase.com/accounts/{username}/integrations/gitlab_syncs` click on More->Configure.
New popup will appear, wait untill everything is loaded (can take some time), you should see new configuration, if configuration is ok `Save settings`.
To try new configuration click on `Export` button to test everyting.
To make new langauge selectable from Codefi, add new language to `src/routes/common/Profile/UserProfile.tsx` on `assets-front` repo.

For extracting new translation keys check `assets-front` readme.

## Documentation

### Locally
This boilerplate comes with [Nest.js Swagger integrations](https://docs.nestjs.com/recipes/swagger).

When running this repo locally, the swagger docs are available on http://localhost:3000/docs/

The body of requests and responses are inferred from files ending in `Request.ts` or `Response.ts`, configured in ./nest-cli.json, the plugin is described [here](https://docs.nestjs.com/recipes/swagger#plugin). Must be classes not interfaces.

