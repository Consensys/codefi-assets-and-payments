import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { nestjsLogger } from '@consensys/observability';

import * as docsOverrides from './utils/docs-override.json';
import { AppModule } from './modules/AppModule';

let context: INestApplication | null = null;
export const ApplicationContext = async () => {
  if (!context) {
    context = await NestFactory.create(AppModule, {
      logger: nestjsLogger(),
    });

    context.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );
    context.use(json({ limit: '10mb' }));
    context.use(urlencoded({ limit: '10mb', extended: true }));
    const options = new DocumentBuilder()
      .setTitle("Codefi's METADATA API")
      .addServer(process.env.SWAGGER_BASE_URL || '/')
      .setDescription('METADATA API')
      .setVersion(process.env.npm_package_version || '')
      .addTag('Tokens', 'Tokens Endpoints.')
      .addTag('Entities', 'Entities Endpoints.')
      .addTag('Healthcheck', 'Healthcheck Endpoints.')
      .addTag('ELEMENTS', 'ELEMENTS Endpoints.')
      .addTag('TEMPLATES', 'TEMPLATES Endpoints.')
      .addTag('INSTANCES', 'INSTANCES Endpoints.')
      .addTag('CYCLES', 'CYCLES Endpoints.')
      .setContact(
        'ConsenSys Codefi',
        'https://codefi.consensys.net',
        'codefi-api@consensys.net',
      )
      .build();
    const document = SwaggerModule.createDocument(context, options);
    SwaggerModule.setup('docs', context, document);
    // Whether to export an Open API spec file to disk for generation of a docs site
    if (process.env.EXPORT_DOCS === 'true') {
      // Now inject static info that Nest doesn't/can't autogenerate.
      // These extensions are added to enrich the generated redoc site with more content, more info here: https://github.com/Redocly/redoc#swagger-vendor-extensions
      Object.assign(document.info, docsOverrides.info);
      if (document.components)
        Object.assign(document.components, docsOverrides.components);
      // Use tag groups to group your API sections. Example in admin-api.
      // document['x-tagGroups'] = docsOverrides['x-tagGroups']

      writeFileSync('./api-spec.json', JSON.stringify(document));
    }
    return context;
  }
};
