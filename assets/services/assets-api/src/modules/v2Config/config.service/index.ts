import { Injectable } from '@nestjs/common';

/**
 * IDENTITY
 * The platform manages user accounts, e.g. an Ethereum wallet and any kind of metadata.
 */
import ErrorService from 'src/utils/errorService';

// APIs
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

import {
  keys as ConfigKeys,
  Config,
  ConfigType,
  TENANT_FLAG,
} from 'src/types/config';
import { CreateConfigOutput } from 'src/modules/v2Utils/utils.dto';
import { NestJSPinoLogger } from '@consensys/observability';
import { UserType } from 'src/types/user';
import { AssetType } from 'src/types/asset/template';

@Injectable()
export class ConfigService {
  constructor(
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly logger: NestJSPinoLogger,
  ) {}

  /**
   * [Retrieve config]
   */
  async createOrUpdateConfig(
    tenantId: string,
    name: string,
    logo: string,
    mailLogo: string,
    mailColor: string,
    mainColor: string,
    mainColorLight: string,
    mainColorLighter: string,
    mainColorDark: string,
    mainColorDarker: string,
    data: any,
    userId: string,
    language: string,
    region: string,
    preferences: any,
    restrictedUserTypes: UserType[],
    restrictedAssetTypes: AssetType[],
  ): Promise<CreateConfigOutput> {
    try {
      const configs: Array<Config> =
        await this.apiMetadataCallService.fetchConfig(tenantId, userId);

      let initialConfig: Config;
      let finalConfig: Config;
      if (!configs) {
        ErrorService.throwError(
          `shall never happen: no answer when requesting config for tenant ${tenantId}`,
        );
      } else if (configs && configs.length > 1) {
        ErrorService.throwError(
          `shall never happen: multiple config files founds for tenant ${tenantId} and user ${userId}`,
        );
      } else if (configs && configs.length < 1) {
        this.logger.info(
          `No config was found for tenant ${tenantId} ${
            userId !== TENANT_FLAG ? `and user ${userId}` : ''
          } ==> create a new config`,
        );
        finalConfig = await this.apiMetadataCallService.createConfigInDB(
          tenantId,
          name,
          logo,
          mailLogo,
          mailColor,
          mainColor,
          mainColorLight,
          mainColorLighter,
          mainColorDark,
          mainColorDarker,
          data || {},
          userId,
          preferences || {},
          language,
          region,
          restrictedUserTypes,
          restrictedAssetTypes,
        );
      } else {
        // configs && configs.length === 1
        initialConfig = configs[0];
        this.logger.info(
          `Config was found for tenant ${tenantId} ${
            userId !== TENANT_FLAG ? `and user ${userId}` : ''
          } ==> update existing config (id: ${initialConfig[ConfigKeys.ID]})`,
        );
        const finalConfigData: any = data
          ? {
              ...initialConfig[ConfigKeys.DATA],
              ...data,
            }
          : initialConfig[ConfigKeys.DATA];
        // cleanup data by removing keys with null values
        Object.keys(finalConfigData).forEach((key: string) => {
          if (finalConfigData[key] === null) {
            delete finalConfigData[key];
          }
        });
        finalConfig = await this.apiMetadataCallService.updateConfigInDB(
          tenantId,
          name || initialConfig[ConfigKeys.NAME],
          logo || initialConfig[ConfigKeys.LOGO],
          mailLogo || initialConfig[ConfigKeys.MAIL_LOGO],
          mailColor || initialConfig[ConfigKeys.MAIL_COLOR],
          mainColor || initialConfig[ConfigKeys.MAIN_COLOR],
          mainColorLight || initialConfig[ConfigKeys.MAIN_COLOR_LIGHT],
          mainColorLighter || initialConfig[ConfigKeys.MAIN_COLOR_LIGHTER],
          mainColorDark || initialConfig[ConfigKeys.MAIN_COLOR_DARK],
          mainColorDarker || initialConfig[ConfigKeys.MAIN_COLOR_DARKER],
          finalConfigData,
          userId || initialConfig[ConfigKeys.USER_ID],
          preferences || initialConfig[ConfigKeys.PREFERENCES],
          language || initialConfig[ConfigKeys.LANGUAGE],
          region || initialConfig[ConfigKeys.REGION],
          restrictedUserTypes ||
            initialConfig[ConfigKeys.RESTRICTED_USER_TYPES],
          restrictedAssetTypes ||
            initialConfig[ConfigKeys.RESTRICTED_ASSET_TYPES],
        );
      }

      let newConfig: boolean;
      if (initialConfig) {
        newConfig = false;
      } else {
        newConfig = true;
      }

      return {
        config: finalConfig,
        newConfig,
        message: `Config ${finalConfig[ConfigKeys.ID]} ${
          newConfig ? 'created' : 'updated'
        } successfully for tenant ${tenantId}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'create or update config',
        'createOrUpdateConfig',
        false,
        500,
      );
    }
  }
  private getDefinedProperties = (
    primary: Config,
    secondary: Config,
  ): Config => {
    const keys = Object.keys(primary);
    const returnVals = { ...secondary };
    keys.forEach((key) => {
      returnVals[key] = primary[key] || secondary[key];
    });
    return returnVals;
  };

  /**
   * [Retrieve tenant config]
   */
  async retrieveTenantConfig(tenantId: string): Promise<Config> {
    try {
      const retrieveConfigOutput: {
        config: Config;
        configType: ConfigType;
      } = await this.retrieveConfig(tenantId, undefined);

      return retrieveConfigOutput.config;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving tenant config',
        'retrieveTenantConfig',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve config]
   */
  async retrieveConfig(
    tenantId: string,
    userId: string,
  ): Promise<{ config: Config; configType: ConfigType }> {
    try {
      const [defaultConfigs, tenantConfigs, userConfigs]: [
        Array<Config>,
        Array<Config>,
        Array<Config>,
      ] = await Promise.all([
        this.apiMetadataCallService.fetchConfig(
          process.env.DEFAULT_CONFIG,
          undefined, // userId
        ),
        tenantId
          ? this.apiMetadataCallService.fetchConfig(
              tenantId,
              TENANT_FLAG, // userId
            )
          : [],
        userId ? this.apiMetadataCallService.fetchConfig(tenantId, userId) : [],
      ]);

      let finalConfig: Config;
      if (defaultConfigs && defaultConfigs.length > 1) {
        ErrorService.throwError(
          'shall never happen: multiple default config files found',
        );
      } else if (defaultConfigs && defaultConfigs.length === 1) {
        finalConfig = {
          ...defaultConfigs[0],
        };
      } else {
        ErrorService.throwError('shall never happen: no config file was found');
      }

      if (tenantConfigs && tenantConfigs.length > 1) {
        ErrorService.throwError(
          `shall never happen: multiple tenant config files founds for tenant ${tenantId}`,
        );
      } else if (tenantConfigs && tenantConfigs.length === 1) {
        finalConfig = {
          ...this.getDefinedProperties(tenantConfigs[0], finalConfig), // Tenant config values shall override default config values
          [ConfigKeys.DATA]: {
            ...finalConfig.data,
            ...tenantConfigs[0].data, // Tenant config values shall override default config values
          },
          [ConfigKeys.PREFERENCES]: {
            ...finalConfig.preferences,
            ...tenantConfigs[0].preferences, // Tenant config values shall override default config values
          },
        };
      }

      if (userConfigs && userConfigs.length > 1) {
        ErrorService.throwError(
          `shall never happen: multiple user config files founds for tenant ${tenantId} and user ${userId}`,
        );
      } else if (userConfigs && userConfigs.length === 1) {
        finalConfig = {
          ...this.getDefinedProperties(userConfigs[0], finalConfig), // User config values shall override default config values
          [ConfigKeys.DATA]: {
            ...finalConfig.data,
            ...userConfigs[0].data, // User config values shall override default config values
          },
          [ConfigKeys.PREFERENCES]: {
            ...finalConfig.preferences,
            ...userConfigs[0].preferences, // User config values shall override default config values
          },
        };
      }

      return {
        config: finalConfig,
        configType:
          tenantConfigs && tenantConfigs.length === 1
            ? ConfigType.CUSTOM
            : ConfigType.DEFAULT,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving config',
        'retrieveConfig',
        false,
        500,
      );
    }
  }
}
