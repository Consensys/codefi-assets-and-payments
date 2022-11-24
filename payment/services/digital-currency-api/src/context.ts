import { NestFactory } from '@nestjs/core'
import { nestjsLogger } from '@consensys/observability'
import { AppModule } from './modules/AppModule'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import * as docsOverrides from './utils/docs-override.json'
import { writeFileSync } from 'fs'
import config from './config'
import { INestApplication } from '@nestjs/common'

let context: INestApplication = null
export const ApplicationContext = async () => {
  if (!context) {
    context = await NestFactory.create(AppModule, {
      logger: nestjsLogger(),
    })
    const options = new DocumentBuilder()
      .setTitle("Codefi's Digital Currency API")
      .setDescription(
        'The Codefi Payments API is organized around [REST](https://en.wikipedia.org/wiki/Representational_state_transfer).\n ' +
          'Codefi Payments API is the perfect foundation for Institutions and Fintechs to offer digital currency services to their customers. We strive to make it easy for institutions to issue digital currencies on blockchain networks and to offer digital currency services to their users.\n' +
          '## Development quickstart\n' +
          'To use Codefi Payments, please contact us.\n' +
          'Codefi Payments can be used in SaaS or be self hosted.\n' +
          'Our experimentation platform, the Codefi Payments Sandbox, helps our customers discover their needs and design solutions with greater value. To register to the sandbox, join the waitlist [here](https://consensys.net/contact/).\n' +
          'Codefi Payments API can be used as self-contained units deployed on each Ethereum node. Each unit holds its own database, manages its own service instances and API’s, manages its own connection to the Ethereum node and private key vault. \n' +
          'There is no "central" server or master node: no stack is more important than the other.  \n\n' +
          'Codefi Payments is compatible with both public and permissioned networks: \n' +
          '* For deployments on permissioned networks, ConsenSys recommends the use of ConsenSys Quorum, the open source Enterprise version of Ethereum (documentation) and Quorum Blockchain Service on Microsoft Azure.    \n' +
          '* For deployments on permissionless networks such as Ethereum Mainnet and Polygon, Codefi Payments API relies on [Infura](https://infura.io/) \n\n' +
          'For more information, [contact us](https://consensys.net/contact/). We will be happy to walk you through to the next steps. \n' +
          '### SaaS\n' +
          'Integrating Codefi Payments API SaaS can begin as soon as you create a Codefi Payments account, and requires three steps\n' +
          '1. Obtain your API keys so Codefi Payments can authenticate your integration’s API requests. To receive your API keys, please contact us\n' +
          '2. Install a client library so your integration can interact with the Codefi Payments API\n' +
          '3. Make a test API request to confirm everything is up and running \n\n' +
          '### On premise (cloud)\n' +
          'To deploy Codefi Payments API on premise (cloud) [contact us](https://consensys.net/contact/).\n' +
          '### Test\n' +
          'To test Codefi Payments API in ConsenSys digital currency sandbox, [contact us](https://consensys.net/contact/).\n' +
          '## Use cases\n' +
          'The Codefi Payments API allows institutions to issue digital currencies on blockchains and to offer digital currency services to their customers. With Codefi Payments, institutions can:\n' +
          '* Manufacture and deploy a digital currency on Ethereum and EVM compatible networks\n' +
          '* Create managed accounts and wallets for their customers\n' +
          '* Sell the digital currency to, and purchase from, their customers \n' +
          '* Monitor the use of the digital currency, including all operations and holders\n' +
          '* Make it easy for their customers to use the digital currency for one or more use cases\n' +
          'With Codefi Payments, institutions can focus on offering embedded digital currency services into their customers’ experience. This may include faster settlement, more transparency, cheaper service, loyalty programs and more.\n' +
          '* Use the digital currency\n' +
          '* Monitor the digital currency usage\n\n' +
          'Codefi Payments API can be used as self-contained units deployed on each participating node of the network. Each unit holds its own database, manages its own service instances and API’s, and manages its own connection to the Ethereum node. There is no "central" server or master node: no stack is more important than the other. The only way that the units have some form of communication is through the blockchain. To do so, they can deploy, mint, transfer and burn tokens. The other units will read the events emitted by the smart contracts.\n' +
          'Issued digital currencies can be used to power multiple institutional use cases such as: \n' +
          '* Retail Central Bank Digital Currency (CBDC)\n' +
          '* Wholesale Central Bank Digital Currency (CBDC)\n' +
          '* Bank digital currency for security settlement\n' +
          '* Retail digital currency\n',
      )
      .setVersion('v0.1.0')
      .addTag(
        'Digital Currencies',
        'Endpoints that relate to the digital currency, whether it’s to initiate operations or retrieve information.',
      )
      .addTag('Operations', 'Digital currencies operations endpoints.')
      .addTag('Holders', 'Digital currencies holders endpoints.')
      .addTag(
        'Operations Request',
        'Operation requests endpoints (create, resolve, retrieve)',
      )
      .addOAuth2()
      .addServer(
        `http://localhost:${config().serverPort}/`,
        "Codefi's Example Server",
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
