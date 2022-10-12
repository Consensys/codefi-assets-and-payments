import { Injectable } from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

import execRetry from 'src/utils/retry';
import errorService from 'src/utils/errorService';
import { ApiCallHelperService } from '.';

const EXTERNAL_STORAGE_HOST: string = process.env.EXTERNAL_STORAGE_API;
const API_NAME = 'External-Storage-Api';

@Injectable()
export class ApiExternalStorageCallService {
  private externalStorage: AxiosInstance;

  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly apiCallHelperService: ApiCallHelperService,
  ) {
    this.externalStorage = axios.create({
      baseURL: EXTERNAL_STORAGE_HOST,
    });
  }

  async getPublic(tenantId: string, key: string): Promise<any> {
    try {
      const retriedClosure = () => {
        return this.externalStorage.get(`/public/${tenantId}/${key}`);
      };
      await execRetry(retriedClosure, 3, 1500, 1);

      return `${EXTERNAL_STORAGE_HOST}/public/${tenantId}/${key}`;
    } catch (error) {
      errorService.throwApiCallError('getPublic', API_NAME, error, 500);
    }
  }

  async uploadPublic(
    tenantId: string,
    key: string,
    content: any,
  ): Promise<any> {
    try {
      const json = JSON.stringify(content);
      const formData = new FormData();
      formData.append('file', json, {
        contentType: 'application/json',
        knownLength: json.length,
        filename: key,
      });

      const retriedClosure = () => {
        return this.externalStorage.post(
          `/public/${tenantId}/${key}`,
          formData,
          {
            headers: formData.getHeaders(),
          },
        );
      };

      await execRetry(retriedClosure, 3, 1500, 1);

      return `${EXTERNAL_STORAGE_HOST}/public/${tenantId}/${key}`;
    } catch (error) {
      errorService.throwApiCallError('uploadPublic', API_NAME, error, 500);
    }
  }

  async updatePublic(
    tenantId: string,
    key: string,
    content: any,
  ): Promise<any> {
    try {
      const json = JSON.stringify(content);
      const formData = new FormData();
      formData.append('file', json, {
        contentType: 'application/json',
        knownLength: json.length,
        filename: key,
      });

      const retriedClosure = () => {
        return this.externalStorage.put(
          `/public/${tenantId}/${key}`,
          formData,
          {
            headers: formData.getHeaders(),
          },
        );
      };

      await execRetry(retriedClosure, 3, 1500, 1);

      return `${EXTERNAL_STORAGE_HOST}/public/${tenantId}/${key}`;
    } catch (error) {
      errorService.throwApiCallError('updatePublic', API_NAME, error, 500);
    }
  }

  async getIpfs(tenantId: string, key: string): Promise<any> {
    try {
      const retriedClosure = () => {
        return this.externalStorage.get(`/ipfs/${tenantId}/${key}`);
      };

      const response = await execRetry(retriedClosure, 3, 1500, 1);

      return response.data;
    } catch (error) {
      errorService.throwApiCallError('uploadIpfs', API_NAME, error, 500);
    }
  }

  async uploadIpfs(tenantId: string, key: string, content: any): Promise<any> {
    try {
      const json = JSON.stringify(content);
      const formData = new FormData();
      formData.append('file', json, {
        contentType: 'application/json',
        knownLength: json.length,
        filename: key,
      });

      const retriedClosure = () => {
        return this.externalStorage.post(`/ipfs/${tenantId}/${key}`, formData, {
          headers: formData.getHeaders(),
        });
      };

      const response = await execRetry(retriedClosure, 3, 1500, 1);

      return response.data;
    } catch (error) {
      errorService.throwApiCallError('uploadIpfs', API_NAME, error, 500);
    }
  }

  async updateIpfs(tenantId: string, key: string, content: any): Promise<any> {
    try {
      const json = JSON.stringify(content);
      const formData = new FormData();
      formData.append('file', json, {
        contentType: 'application/json',
        knownLength: json.length,
        filename: key,
      });

      const retriedClosure = () => {
        return this.externalStorage.put(`/ipfs/${tenantId}/${key}`, formData, {
          headers: formData.getHeaders(),
        });
      };

      const response = await execRetry(retriedClosure, 3, 1500, 1);

      return response.data;
    } catch (error) {
      errorService.throwApiCallError('updateIpfs', API_NAME, error, 500);
    }
  }
}
