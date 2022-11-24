import { Injectable, HttpStatus } from '@nestjs/common';
import { NestJSPinoLogger } from '@consensys/observability';

import ErrorService from 'src/utils/errorService';
import { AxiosInstance } from 'src/services/instances/AxiosInstance';
import execRetry from 'src/utils/retry';
import { Config, TENANT_FLAG } from './constants';

const API_NAME = '[Metadata-API]';
const METADATA_HOST = process.env.METADATA_API;

@Injectable()
export class ApiMetadataService {
  constructor(
    private readonly axios: AxiosInstance,
    private readonly logger: NestJSPinoLogger,
  ) {}

  async retrieveConfig(tenantId: string, userId?: string): Promise<Config> {
    try {
      const requestUrl = `${METADATA_HOST}/configs?tenantId=${tenantId}&userId=${
        userId ?? TENANT_FLAG
      }`;
      const retriedClosure = () => {
        return this.axios.instance().get(requestUrl);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);
      this.logger.info({ userId }, 'Config has been retrieved.');
      if (response.data.length === 0) {
        throw new Error('no config has been found');
      }
      return response.data[0];
    } catch (error) {
      this.logger.error(error);
      ErrorService.throwApiCallError(
        'retrieveConfig',
        API_NAME,
        error,
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
