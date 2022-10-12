import { NestFactory } from '@nestjs/core';
import { nestjsLogger } from '@codefi-assets-and-payments/observability'; // Codefi logger
import { AppModule } from 'src/modules/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AuthenticationGuard } from './authentication.guard';

import * as docsOverrides from './docs-override.json';
import { writeFileSync } from 'fs';
import { ApiEntityCallService } from './modules/v2ApiCall/api.call.service/entity';
import config from './config';

const exportDocs = config().exportDocs;
const apmEnv = config().apmEnv;

let context: INestApplication = null;
export const ApplicationContext = async () => {
  if (!context) {
    const appLogger = nestjsLogger();
    context = await NestFactory.create(AppModule);

    const apiEntityCallService = context.get(ApiEntityCallService);

    context.useGlobalGuards(
      new AuthenticationGuard(appLogger.logger, apiEntityCallService),
    );
    context.useGlobalPipes(new ValidationPipe({ transform: true }));
    if (apmEnv !== 'production') {
      const options = new DocumentBuilder()
        .setTitle('Codefi Assets API')
        .setDescription(
          'This API allows to issue and manage tokenized financial assets on Ethereum.',
        )
        .setVersion('1.0')
        .setContact(
          'ConsenSys Codefi',
          'https://codefi.consensys.net',
          'codefiassets@consensys.net',
        )
        .addTag(
          'Users',
          'Users can be managed on the platform.\nA user is an object in Codefi database, which controls one or multiple Ethereum wallets.\nA Codefi user can be controlled by an identity in Auth0 (identity provider).',
        )
        .addTag(
          'Wallets',
          'Ethereum wallets can be managed on the platform.\nWallets allow to sign blockchain transactions. Wallets can either be generated and stored in a vault managed by Codefi or managed by the API user himself. In this last case, the wallet just needs to be registered in the API, even though transactions will be signed outside the API.',
        )
        .addTag(
          'Fungible tokens',
          'Fungible tokens can be managed on the platform.\nFungible tokens are all identical and can not be distinguished from each other.\nThe token standard used for fungible tokens in this API is an inheritance of OpenZeppelin ERC20 and Ownable smart contracts. It verifies ERC20 interface.',
        )
        .addTag(
          'Non-fungible tokens',
          'Non-fungible tokens can be managed on the platform.\nNon-fungible tokens are all unique and can be distinguished from each other.\nThe token standard used for non-fungible tokens in this API is an inheritance of OpenZeppelin ERC721 and Ownable smart contracts. It verifies ERC721 interface.',
        )
        .addTag(
          'Hybrid tokens',
          'Hybrid tokens can be managed on the platform.\nHybrid tokens are partially-fungible, which means tokens can be given a class/state and are fungible inside a given class/state.\nThe token standard used for hybrid tokens in this API is the Universal Token smart contract (https://github.com/ConsenSys/UniversalToken). It verifies both ERC20 and ERC1400 interfaces.',
        )
        .addTag(
          'Transactions',
          'Transactions can be managed on the platform.\nEvery time an token action is performed (mint, transfer, burn), a transaction is sent to the blockchain network.\nThis API keeps track of the transactions by storing the transaction ID + the transaction context in an off-chain database.',
        )
        .addTag(
          'Networks',
          'Networks can be managed on the platform.\nThe platform is network-agnostic: assets can be deployed on different kind of networks, public or private.',
        )
        .addOAuth2()
        .addBearerAuth(
          { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
          'access-token',
        )
        .addServer('http://localhost:3002', 'Localhost')
        .addServer(
          'https://assets-paris-demo.codefi.network/api/assets',
          "Codefi's Dev Server",
        )
        .build();
      const document = SwaggerModule.createDocument(context, options);
      SwaggerModule.setup('docs', context, document);

      // Whether to export an Open API spec file to disk for generation of a docs site
      if (exportDocs) {
        // Now inject static info that Nest doesn't/can't autogenerate.
        // These extensions are added to enrich the generated redoc site with more content, more info here: https://github.com/Redocly/redoc#swagger-vendor-extensions
        Object.assign(document.info, docsOverrides.info);
        Object.assign(document.components, docsOverrides.components);
        document['x-tagGroups'] = docsOverrides['x-tagGroups'];

        writeFileSync('./api-spec.json', JSON.stringify(document));
      }
    }

    return context;
  }
};
