import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/AppModule'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import cfg from './config'
import { writeFileSync } from 'fs'
import * as docsOverrides from './utils/docs-override.json'
import { nestjsLogger } from '@consensys/observability'

let context = null
export const ApplicationContext = async () => {
  if (!context) {
    context = await NestFactory.create(AppModule, {
      logger: nestjsLogger(),
    })
    const options = new DocumentBuilder()
      .setTitle('Codefi Admin API')
      .setDescription(
        '# Introducing the Consensys Codefi Admin API \nThe Admin API allows Consensys OS and Product Sales & Services developers to configure and manage the IAM platform their API deployment depends on. For more information. Reach out to codefi-api@consensys.net \n# Using this API \n1. If you are creating a new API for a client using our [api-boilerplate](https://gitlab.com/consensys-defi/api/api-boilerplate) and you want to protect this API with Authentication provided by the IAM platform, you will first create the API in Auth0 using the `/api` route. Include any scopes your API enforces. \n2. Create an API key with the `/client` endpoint. The name should identify what this key is used for. Please provide context with the description field to outline who the key has been given to and in what context (dev or prod key), include a salesforce lead if applicable. In the response you will be given a `client_id` and `client_secret`. \n3. Use this `client_id` to grant access for your application to call your new API with the scopes you want the application to have. You should now be able to perform the `client_credentials` authorization flow with your key and secret, to generate a bearer token with the permission to call your API. The docs for this authentication flow are found here: https://auth0.com/docs/api/authentication#client-credentials-flow\n4. If you want to act on behalf of an end user, you need to implement the `authorisation_code` auth flow. Create an application capable of using this auth flow with the `/client` endpoint, setting app_type to be **regular_web**, and then use that application to implement the `authorisation_code` authentication flow with 2 calls to the Auth0 Authentication API. \n\n    - First, follow the instructions to obtain user authorization to call an API on their behalf using [this endpoint.](https://auth0.com/docs/api/authentication#authorize-application)\n\n    - Then exchange the code returned for a bearer token to send to the API https://auth0.com/docs/api/authentication#authorization-code-flow45\n\n    - You can now call our endpoints with the `access_token` from Auth0 set in the request headers like: `Authorization: bearer <access_token>`',
      )
      .setVersion('v0.6.0')
      .setContact(
        'ConsenSys Codefi',
        'https://codefi.consensys.net',
        'codefi-api@consensys.net',
      )
      .addTag(
        'APIs',
        'APIs are Auth0 resource servers. Use these endpoints to register new APIs and their associated `scopes`. Once you create an API, you can subsequently create Clients that can use the API with the /application endpoints.',
      )
      .addTag(
        'Clients',
        "Clients (or sometimes called 'Applications') are the basis for accessing Consensys OS APIs. When creating and managing a Client with these endpoints, you can specify what Consensys OS APIs this Client can interact with as well what actions it can perform with these APIs through the granting of `scopes`. Clients can call APIs in one of two ways.\n- By acting on their own behalf \n- By acting on behalf of end users.\n\nFor a client to act on it's own behalf, it performs an OAuth `client_credentials` flow. This involves exchanging a Client's Key and Secret for a bearer token that is authorised to access one of our APIs with zero or more `scopes` (permissions).\n\nFor a Client to act on behalf of a user, it implements the OAuth `authorisation_code` flow. This is a two step process, where the client first sets up a request for access to an API, and secondly, redirects a user in a browser to an Auth0 controlled website, where they can approve this client to act on their behalf. Once approved, a Client can call the API on behalf of the user. Read more about our Authentication flows [here.](https://codefi.atlassian.net/wiki/spaces/PROD/pages/207192087/Authentication+for+an+API)",
      )
      .addTag('Other', 'System Health endpoints.')
      .addTag(
        'Hooks',
        'These are endpoints that receive hook triggers from the identity provider when a specific event occurs. Usually used in tandem with Auth0 rules. You likely do not need to call these endpoints. ',
      )
      .addTag(
        'Grants',
        "These endpoints are for managing what APIs a Client can access when it is acting on behalf of itself, (the `client_credentials` flow), i.e. clients created as 'Machine to Machine'  types via the UI or with the `/client` endpoint on this API with type set to `non_interactive`. \nAdd and remove the permission to call APIs and their respective API scopes from existing Clients with these endpoints. \n\nThese endpoints are not applicable to the `authorisation_code` flow. Permissions for those flows are managed by the end users themselves. (Though in future, we can expose administrative endpoints to manage them if need be).",
      )
      .addTag(
        'Users',
        'These endpoints are for managing Users within the configured identity provider. ',
      )
      .addTag(
        'Roles',
        'These endpoints are for managing Roles and their permissions',
      )
      .addTag('Tenants', 'These endpoints are for managing Tenants')
      .addOAuth2()
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'access-token',
      )
      .addServer('http://localhost:3000', 'Localhost')
      .addServer('https://dev.api.codefi.network/admin', "Codefi's Dev Server")
      .build()
    const document = SwaggerModule.createDocument(context, options)
    if (cfg().docs.enableSwagger) {
      SwaggerModule.setup('docs', context, document)
    }

    // Whether to export an Open API spec file to disk for generation of a docs site
    if (cfg().docs.exportDocs) {
      // Now inject static info that Nest doesn't/can't autogenerate.
      // These extensions are added to enrich the generated redoc site with more content, more info here: https://github.com/Redocly/redoc#swagger-vendor-extensions
      Object.assign(document.info, docsOverrides.info)
      Object.assign(document.components, docsOverrides.components)
      // document['x-tagGroups'] = docsOverrides['x-tagGroups']

      writeFileSync('./api-spec.json', JSON.stringify(document))
    }

    return context
  }
}
