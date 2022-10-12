import { Injectable } from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { TenantService } from './tenant';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { keys as ConfigKeys, Config, TENANT_FLAG } from 'src/types/config';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { NetworkService } from 'src/modules/v2Network/network.service';
import { keys as TokenKeys, Token } from 'src/types/token';
import { TokenIdentifierEnum } from 'src/old/constants/enum';

@Injectable()
export class NetworkSelectionService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly tenantService: TenantService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly configService: ConfigService,
    private readonly networkService: NetworkService,
  ) {}

  async replaceChainIdByNetworkKeyWhenRequired(
    dryRun: boolean,
    cleanConfigs: boolean,
    cleanTokens: boolean,
  ) {
    this.logger.info('REPLACE CHAINID BY NETWORK KEY');

    const { tenantIds } =
      await this.tenantService.listAllTenantIdsAndClientApplicationsInAuth0();

    const configsWithValidDefaultNetworkKey: Array<{
      id: string;
      name: string;
      tenantId: string;
    }> = [];

    const missingConfigs: Array<{
      tenantId: string;
    }> = [];

    const configsWithoutDefaultNetworkKey: Array<{
      id: string;
      name: string;
      tenantId: string;
    }> = [];

    const configsWithInvalidDefaultNetworkKey: Array<{
      id: string;
      name: string;
      tenantId: string;
    }> = [];

    const tokensWithValidDefaultNetworkKey: Array<{
      id: string;
      tenantId: string;
    }> = [];
    const tokensWithoutDefaultNetworkKey: Array<Token> = [];
    const tokensWithInvalidDefaultNetworkKey: Array<Token> = [];

    const unexpectedConfigIssue: Array<Config> = [];
    const unexpectedTokenIssue: Array<Token> = [];

    let counter = 0;
    for (const tenantId of tenantIds) {
      this.logger.info(
        {},
        `Checking tenant with id ${tenantId} (number ${++counter}/${
          tenantIds.length
        })`,
      );

      const {
        validNetworkKeysMap,
        chainIdToFirstMatchingNetworkKey,
        defaultNetworkKey,
      } = await this.networkService.retrieveValidNetworksMap(tenantId);

      const configs: Array<Config> =
        await this.apiMetadataCallService.fetchConfig(tenantId, TENANT_FLAG);

      let config: Config;
      let cleanConfig: boolean;
      if (
        configs?.length === 1 &&
        configs[0]?.[ConfigKeys.TENANT_ID] === tenantId
      ) {
        config = configs[0];
      } else {
        missingConfigs.push({ tenantId });

        cleanConfig = true;
      }

      const configDefaultNetworkKey =
        config?.[ConfigKeys.DATA]?.[ConfigKeys.DATA__DEFAULT_NETWORK_KEY];
      if (!configDefaultNetworkKey) {
        // Config without defaultNetworkKey
        configsWithoutDefaultNetworkKey.push({
          id: config?.[ConfigKeys.ID],
          name: config?.[ConfigKeys.NAME],
          tenantId: config?.[ConfigKeys.TENANT_ID] || tenantId,
        });

        cleanConfig = true;
      } else if (!validNetworkKeysMap[configDefaultNetworkKey]) {
        // Config with invalid defaultNetworkKey
        configsWithInvalidDefaultNetworkKey.push({
          id: config?.[ConfigKeys.ID],
          name: config?.[ConfigKeys.NAME],
          tenantId: config?.[ConfigKeys.TENANT_ID] || tenantId,
        });

        cleanConfig = true;
      } else {
        configsWithValidDefaultNetworkKey.push({
          id: config?.[ConfigKeys.ID],
          name: config?.[ConfigKeys.NAME],
          tenantId: config?.[ConfigKeys.TENANT_ID] || tenantId,
        });
      }

      if (!dryRun && cleanConfigs && cleanConfig) {
        try {
          const configDefaultChainId =
            config?.[ConfigKeys.DATA]?.[ConfigKeys.DATA__DEFAULT_CHAIN_ID];

          const newDefaultNetworkKey =
            chainIdToFirstMatchingNetworkKey[configDefaultChainId] ||
            defaultNetworkKey;
          const newConfigData = {
            ...config?.[ConfigKeys.DATA],
            [ConfigKeys.DATA__DEFAULT_NETWORK_KEY]: newDefaultNetworkKey,
          };

          config = (
            await this.configService.createOrUpdateConfig(
              tenantId,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              newConfigData,
              TENANT_FLAG, // userId
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
            )
          ).config;
        } catch (error) {
          unexpectedConfigIssue.push(config);
        }
      }

      // Fetch tokens
      const allTokens: Array<Token> = (
        await this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.all,
          undefined, // tokenKey
          false, // shallReturnSingleToken
          undefined, // offset
          undefined, // limit
          false, // withAssetData
        )
      ).tokens;

      let counter2 = 0;
      for (const token of allTokens) {
        this.logger.info(
          {},
          `Checking tenant with id ${tenantId}, token with id ${
            token[TokenKeys.TOKEN_ID]
          } (number ${++counter2}/${allTokens.length})`,
        );

        let cleanToken: boolean;

        const tokenDefaultNetworkKey = token?.[TokenKeys.DEFAULT_NETWORK_KEY];
        if (!tokenDefaultNetworkKey) {
          cleanToken = true;
          tokensWithoutDefaultNetworkKey.push(token);
        } else if (
          !(
            validNetworkKeysMap[tokenDefaultNetworkKey] ||
            tokenDefaultNetworkKey?.includes('hardhat') ||
            tokenDefaultNetworkKey?.includes('ganache')
          )
        ) {
          cleanToken = true;
          tokensWithInvalidDefaultNetworkKey.push(token);
        } else {
          tokensWithValidDefaultNetworkKey.push({
            id: token[TokenKeys.TOKEN_ID],
            tenantId: token[TokenKeys.TENANT_ID],
          });
        }

        if (!dryRun && cleanTokens && cleanToken) {
          try {
            const tokenDefaultChainId = token?.[TokenKeys.DEFAULT_CHAIN_ID];
            const newTokenDefaultNetworkKey =
              chainIdToFirstMatchingNetworkKey[tokenDefaultChainId] ||
              config?.[ConfigKeys.DATA]?.[
                ConfigKeys.DATA__DEFAULT_NETWORK_KEY
              ] ||
              defaultNetworkKey;

            const tokenUpdates = {
              [TokenKeys.DEFAULT_NETWORK_KEY]: newTokenDefaultNetworkKey,
            };

            await this.apiMetadataCallService.updateTokenInDB(
              token[TokenKeys.TENANT_ID],
              token[TokenKeys.TOKEN_ID],
              tokenUpdates,
            );
          } catch (error) {
            unexpectedTokenIssue.push(token);
          }
        }
      }
    }

    return {
      missingConfigs,
      configsWithValidDefaultNetworkKey,
      configsWithoutDefaultNetworkKey,
      configsWithInvalidDefaultNetworkKey,
      tokensWithValidDefaultNetworkKey,
      tokensWithoutDefaultNetworkKey,
      tokensWithInvalidDefaultNetworkKey,
      unexpectedConfigIssue,
      unexpectedTokenIssue,
    };
  }
}
