import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/AppModule'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { nestjsLogger } from '@consensys/observability'
import { json, urlencoded } from 'express'

let context = null
export const ApplicationContext = async () => {
  if (!context) {
    context = await NestFactory.create(AppModule, {
      logger: nestjsLogger(),
    })
    context.use(json({ limit: '50mb' }))
    context.use(urlencoded({ limit: '50mb', extended: true }))
    const options = new DocumentBuilder()
      .setTitle('Workflow API')
      .setDescription('API description')
      .setVersion('1.0')
      .build()
    const document = SwaggerModule.createDocument(context, options)
    SwaggerModule.setup('docs', context, document)
    return context
  }
}
