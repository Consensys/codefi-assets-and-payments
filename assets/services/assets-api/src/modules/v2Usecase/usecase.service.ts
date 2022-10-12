import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

@Injectable()
export class UsecaseService {
  constructor(
    private readonly apiMetadataCallService: ApiMetadataCallService,
  ) {}

  /**
   * [List all usecases]
   * Returns the list of all usecase.
   *
   */
  async listAllUsecases(tenantId: string) {
    try {
      const results = await this.apiMetadataCallService.fetchUsecases(tenantId);
      return results;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing usecases',
        'listAllUsecases',
        false,
        500,
      );
    }
  }

  /**
   * [returns usecase by name]
   * Returns a single usecase.
   *
   */
  async getUsecase(tenantId: string, usecase: string) {
    try {
      const results = await this.apiMetadataCallService.fetchUsecases(
        tenantId,
        usecase,
      );
      return results;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'fetch usecase',
        'getUsecase',
        false,
        500,
      );
    }
  }

  /**
   * [Create a usecase]
   * Returns the new usecase.
   *
   */
  async createUsecase(tenantId: string, name: string, config: any, keys: any) {
    try {
      const results = await this.apiMetadataCallService.createUsecases(
        tenantId,
        name,
        config,
        keys,
      );
      return results;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating usecase',
        'createUsecase',
        false,
        500,
      );
    }
  }

  /**
   * [Delete a usecase]
   * Returns status of the delete usecase.
   *
   */
  async deleteUsecase(tenantId: string, name: string) {
    try {
      const results = await this.apiMetadataCallService.deleteUsecases(
        tenantId,
        name,
      );
      return results;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting usecase',
        'deleteUsecase',
        false,
        500,
      );
    }
  }

  /**
   * [Edit a usecase]
   * Returns the updated usecase.
   *
   */
  async editUsecase(tenantId: string, name: string, config: any, keys: any) {
    try {
      const results = await this.apiMetadataCallService.updateUsecases(
        tenantId,
        name,
        config,
        keys,
      );
      return results;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'editing usecase',
        'editUsecase',
        false,
        500,
      );
    }
  }
}
