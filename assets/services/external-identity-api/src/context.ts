import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/app.module'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import * as docsOverrides from './utils/docs-override.json'
import { writeFileSync } from 'fs'
import config from './config'
import { INestApplication } from '@nestjs/common'
import { nestjsLogger } from '@consensys/observability'

let context: INestApplication = null
export const ApplicationContext = async (): Promise<INestApplication> => {
  if (!context) {
    context = await NestFactory.create(AppModule, {
      logger: nestjsLogger(),
    })
    const options = new DocumentBuilder()
      .setTitle('External Identity microservice')
      .setDescription(
        'Microservise that provides access for external identity microservices like OnFido',
      )
      .setVersion('v0.1.0')
      .addTag('Other', 'System Health Endpoints.')
      .addTag('Example', 'Example Endpoints.')
      .addOAuth2()
      .setContact(
        'ConsenSys Codefi',
        'https://codefi.consensys.net',
        'codefi-api@consensys.net',
      )
      .addServer(
        `http://localhost:${config().serverPort}/`,
        "Codefi's Example Server",
      )
      .build()
    const document = SwaggerModule.createDocument(context, options)
    SwaggerModule.setup('docs', context, document)
    // Whether to export an Open API spec file to disk for generation of a docs site
    if (process.env.EXPORT_DOCS === 'true') {
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
