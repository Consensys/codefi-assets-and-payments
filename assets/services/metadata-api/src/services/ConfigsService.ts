import {
  Injectable,
  HttpException,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { v4 as uuidv4 } from 'uuid';
import { validateSync } from 'class-validator';
import fs from 'fs';

import {
  prettify,
  removeEmpty,
  areDatabaseObjectsEqual,
} from 'src/utils/common';
import { ConfigsDto, InitConfigsDto } from 'src/model/dto/ConfigsDto';
import { Configs } from 'src/model/ConfigEntity';
import { plainToClass } from 'class-transformer';

const configsFolder = __dirname + '/../configurations/configs';

@Injectable()
export class ConfigsService implements OnModuleInit {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(Configs)
    private readonly configsRepository: Repository<Configs>,
  ) {}

  async onModuleInit() {
    this.logger.info('Import default configurations');
    const configFiles = fs.readdirSync(configsFolder);
    for (const configFile of configFiles) {
      try {
        const conf = JSON.parse(
          fs.readFileSync(configsFolder + '/' + configFile, 'utf8'),
        );
        this.upsertConfig(conf, false);
      } catch (error) {
        this.logger.error(error);
      }
    }
  }

  async upsertConfig(config: InitConfigsDto, isHTTPRequest = true) {
    const errors = validateSync(plainToClass(InitConfigsDto, config));
    if (errors.length > 0) {
      this.logger.error(errors);
      if (isHTTPRequest) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        return;
      }
    } else {
      const allDbConfigs = await this.find();
      const matchingDbConfig = allDbConfigs.find(
        (dbConfig) =>
          dbConfig.tenantId === config.tenantId &&
          dbConfig.userId === config.userId,
      );
      try {
        if (!matchingDbConfig) {
          await this.create(config.tenantId, config.userId, config);
        } else {
          if (!areDatabaseObjectsEqual(matchingDbConfig, config)) {
            await this.update(
              matchingDbConfig.tenantId,
              matchingDbConfig.userId,
              config,
            );
          }
        }
      } catch (error) {
        this.logger.error(error);
        if (isHTTPRequest) {
          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              error,
            },
            HttpStatus.BAD_REQUEST,
          );
        } else {
          return;
        }
      }
    }
  }

  async create(
    tenantId: string,
    userId: string,
    config: ConfigsDto,
  ): Promise<Configs> {
    const {
      name,
      logo,
      mailLogo,
      mailColor,
      mainColor,
      mainColorLight,
      mainColorLighter,
      mainColorDark,
      mainColorDarker,
      language,
      region,
      restrictedAssetTypes,
      restrictedUserTypes,
      data,
      preferences,
    } = config;
    if (!userId) {
      userId = 'tenant';
    }
    if (!tenantId) {
      const error = 'tenantId can not be undefined';
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const configWithSameTenantIdAndUser = await this.configsRepository.findOne({
      where: { tenantId, userId },
    });
    if (configWithSameTenantIdAndUser) {
      const error = `Config with tenantId ${tenantId} and userId ${userId} already exists`;
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return this.configsRepository.save({
        id: uuidv4(),
        userId,
        tenantId,
        name,
        mailLogo,
        mailColor,
        logo,
        mainColor,
        mainColorLight,
        mainColorLighter,
        mainColorDark,
        mainColorDarker,
        language,
        region,
        restrictedAssetTypes,
        restrictedUserTypes,
        data,
        preferences,
      });
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  find(tenantId?: string, userId?: string): Promise<Array<Configs>> {
    if (tenantId) {
      const entity = userId ?? 'tenant';
      return this.configsRepository.find({
        where: [{ tenantId, userId: entity }],
        order: { createdAt: 'DESC' },
      });
    }
    return this.configsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    tenantId: string,
    userId: string,
    {
      name,
      logo,
      mailLogo,
      mailColor,
      mainColor,
      mainColorLight,
      mainColorLighter,
      mainColorDark,
      mainColorDarker,
      language,
      region,
      restrictedAssetTypes,
      restrictedUserTypes,
      data,
      preferences,
    }: ConfigsDto,
  ): Promise<Configs> {
    if (!tenantId) {
      const error = 'tenantId can not be undefined';
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const targetConfigs = await this.find(tenantId, userId);

    if (!(targetConfigs && targetConfigs.length === 1)) {
      let errorMessage = '';
      if (!targetConfigs) {
        errorMessage = 'shall never happen: no response when fetching config';
      } else if (targetConfigs.length < 1) {
        errorMessage = `no config found for tenantId ${tenantId}`;
      } else if (targetConfigs.length > 1) {
        errorMessage = `shall never happen: multiple configs found for tenantId ${tenantId}`;
      }
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: errorMessage,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const targetConfig: Configs = targetConfigs[0];

    // If it exists, update it
    if (targetConfig) {
      try {
        const newData = {
          ...targetConfig,
          preferences: {
            ...(targetConfig.preferences || {}),
            ...preferences,
          },
          ...removeEmpty({
            tenantId,
            userId,
            name,
            mailLogo,
            mailColor,
            logo,
            mainColor,
            mainColorLight,
            mainColorLighter,
            mainColorDark,
            mainColorDarker,
            language,
            region,
            restrictedAssetTypes,
            restrictedUserTypes,
            data,
          }),
        };
        const updatedConfig = await this.configsRepository.save(newData);
        this.logger.info(`Updated config: ${prettify(updatedConfig)}`);
        return updatedConfig;
      } catch (error) {
        this.logger.error(error);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      const error = `Unable to find the config with tenantId=${tenantId}`;
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async delete(
    tenantId: string,
    userId?: string,
  ): Promise<{ message: string }> {
    if (!tenantId) {
      const error = 'tenantId can not be undefined';
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const targetConfigs = await this.find(tenantId, userId || 'tenant');

    if (!(targetConfigs && targetConfigs.length === 1)) {
      let errorMessage = '';
      if (!targetConfigs) {
        errorMessage = 'shall never happen: no response when fetching config';
      } else if (targetConfigs.length < 1) {
        errorMessage = `no config found for tenantId ${tenantId}`;
      } else if (targetConfigs.length > 1 && !userId) {
        errorMessage = `shall never happen: multiple configs found for tenantId ${tenantId}`;
      } else if (targetConfigs.length > 1 && userId) {
        errorMessage = `there are ${
          targetConfigs.length - 1
        } users for tenantId ${tenantId}`;
      }
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: errorMessage,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const targetConfig: Configs = targetConfigs[0];

    const { affected } = await this.configsRepository.delete(targetConfig.id);
    if (affected && affected > 0) {
      const message = `${affected} deleted config(s).`;
      this.logger.info(message);
      return { message };
    } else {
      const error = `Unable to find the config with tenantId ${tenantId}`;
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async deleteByTenant(tenantId: string): Promise<{ [key: string]: number }> {
    if (!tenantId) {
      const error = 'tenantId can not be undefined';
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const { affected } = await this.configsRepository.delete({ tenantId });
    const message = `${affected} deleted config(s).`;
    this.logger.info(message);
    return { deletedConfigsTotal: affected || 0 };
  }
}
