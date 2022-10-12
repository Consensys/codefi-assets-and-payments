import { NestFactory } from '@nestjs/core'
import { nestjsLogger } from '@codefi-assets-and-payments/observability'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { writeFileSync } from 'fs'
import { INestApplication } from '@nestjs/common'
import { AppModule } from './modules/AppModule'
import * as docsOverrides from './utils/docs-override.json'
import config from './config'

let context: INestApplication = null
export const ApplicationContext = async () => {
  if (!context) {
    context = await NestFactory.create(AppModule, {
      logger: nestjsLogger(),
    })
    const options = new DocumentBuilder()
      .setTitle("Codefi's API Mailing")
      .addServer(process.env.SWAGGER_BASE_URL || '/')
      .setVersion(process.env.npm_package_version)
      .addTag('Other', 'System Health Endpoints.')
      .addTag('Mailing', 'Mailing Endpoints.')
      .addBearerAuth()
      .setContact(
        'ConsenSys Codefi',
        'https://codefi.consensys.net',
        'codefi-api@consensys.net',
      )
      .build()
    const document = SwaggerModule.createDocument(context, options)
    if (config().docs.enableSwagger) {
      SwaggerModule.setup('docs', context, document)
    }
    // Whether to export an Open API spec file to disk for generation of a docs site
    if (config().docs.exportDocs) {
      // Now inject static info that Nest doesn't/can't autogenerate.
      // These extensions are added to enrich the generated redoc site with more content, more info here: https://github.com/Redocly/redoc#swagger-vendor-extensions
      Object.assign(document.info, docsOverrides.info)
      Object.assign(document.components, docsOverrides.components)
      // Use tag groups to group your API sections. Example in admin-api.
      // document['x-tagGroups'] = docsOverrides['x-tagGroups']

      writeFileSync('./api-spec.json', JSON.stringify(document))
    }
    return context
  }
}
