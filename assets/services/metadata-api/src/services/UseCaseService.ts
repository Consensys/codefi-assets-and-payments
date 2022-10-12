import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { requireTenantId } from 'src/utils/tenant';
import { UseCaseDto } from 'src/model/dto/UseCaseDto';
import { AssetUsecaseEntity } from '../model/AssetUsecaseEntity';

const useasesConfigs = __dirname + '/../configurations/assets/usecases/configs';
const usecasesKeys = __dirname + '/../configurations/assets/usecases/keys';

@Injectable()
export class UseCaseService implements OnModuleInit {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(AssetUsecaseEntity)
    private readonly repository: Repository<AssetUsecaseEntity>,
  ) {}

  async onModuleInit() {
    const usecaseFilenames = fs.readdirSync(useasesConfigs);

    for (const usecaseFilename of usecaseFilenames) {
      try {
        const config = JSON.parse(
          this.readFile(`${useasesConfigs}/${usecaseFilename}`),
        );
        const keys = JSON.parse(
          this.readFile(
            `${usecasesKeys}/${usecaseFilename.replace('.json', '-keys.json')}`,
          ),
        );

        const usecaseName = usecaseFilename.replace('.json', '');

        const currentUsecase = {
          tenantId: config.tenantId,
          name: usecaseName,
          config,
          keys,
        };
        const existingUsecase = await this.repository.findOne({
          where: { name: usecaseName, tenantId: config.tenantId },
        });

        // only add new usecase if it doesn't exist, mainly used on cluster creation, then updated by the superadmin.
        if (!existingUsecase) {
          const usecase = await this.repository.create({
            ...currentUsecase,
            id: uuidv4(),
          });
          await this.repository.save(usecase);
        }
      } catch (e) {
        this.logger.error(
          `failed to parse elements ${usecaseFilename}: ${e.message}`,
        );
      }
    }
  }

  async getConfigs(
    tenantId: string,
    usecase?: string,
  ): Promise<AssetUsecaseEntity | AssetUsecaseEntity[] | null> {
    requireTenantId(tenantId);

    if (usecase) {
      return this.repository.findOne({ where: { name: usecase } });
    } else {
      return this.repository
        .createQueryBuilder()
        .where('"tenantId" = :tenantId OR "tenantId" = :codefi', {
          tenantId: tenantId,
          codefi: 'codefi',
        })
        .getMany();
    }
  }

  async createConfig({ name, config, keys }: UseCaseDto, tenantId: string) {
    requireTenantId(tenantId);
    const existingUsecase = await this.repository.findOne({
      where: {
        name,
        tenantId,
      },
    });

    if (existingUsecase) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'usecase already exists, please try usecase update instead',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const usecase = this.repository.create({
      id: uuidv4(),
      tenantId,
      keys,
      name,
      config,
    });
    await this.repository.save(usecase);
    return this.returnMessage('1 new usecase created.');
  }

  async updateConfig({ name, config, keys }: UseCaseDto, tenantId: string) {
    const usecase = await this.repository.findOne({
      where: {
        name,
        tenantId,
      },
    });

    if (!usecase) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'usecase not found',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.repository.save({
      ...usecase,
      ...{
        name,
        config,
        keys,
      },
    });

    return this.returnMessage('1 new usecase updated.');
  }

  async delete(name: string, tenantId: string) {
    requireTenantId(tenantId);

    await this.repository.delete({
      name,
    });
    return this.returnMessage('1 usecase deleted.');
  }

  returnMessage(message: string) {
    this.logger.info(message);
    return {
      message,
    };
  }

  readFile(path: string) {
    return fs.readFileSync(path, 'utf8');
  }
}
