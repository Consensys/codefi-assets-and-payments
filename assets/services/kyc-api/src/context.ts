import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/AppModule';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { nestjsLogger } from '@consensys/observability';

let context = null;
export const ApplicationContext = async () => {
  if (!context) {
    context = await NestFactory.create(AppModule, {
      logger: nestjsLogger(),
    });
    const options = new DocumentBuilder()
      // tslint:disable-next-line: quotemark
      .setTitle("Codefi's KYC API")
      .setDescription('API KYC')
      .setVersion(process.env.npm_package_version)
      .addServer(process.env.SWAGGER_BASE_URL || '/')
      .addTag('elements', 'KYC elements')
      .addTag('templates', 'KYC templates')
      .addTag('reviews', 'KYC reviews')
      .addTag('check', 'KYC check')
      .addTag('elementInstances', 'KYC elementInstances')
      .addTag('healthcheck', 'KYC API healthcheck')
      .setContact(
        'ConsenSys Codefi',
        'https://codefi.consensys.net',
        'codefi-api@consensys.net',
      )
      .build();
    const document = SwaggerModule.createDocument(context, options);
    SwaggerModule.setup('docs', context, document);
    return context;
  }
};
