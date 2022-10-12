import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

// APIs
import { EntityEnum, User } from 'src/types/user';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

@Injectable()
export class UserVehiclesListingService {
  constructor(private readonly apiEntityCallService: ApiEntityCallService) {}
  /**
   * [List all vehicles of a given user]
   */
  async listAllUsersVehicles(
    tenantId: string,
    userId: string,
  ): Promise<Array<User>> {
    try {
      const vehiclesList: Array<User> =
        await this.apiEntityCallService.fetchFilteredEntities(
          tenantId,
          EntityEnum.superUserId,
          userId,
          true, // includeWallets
        );
      return vehiclesList;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "listing a user's vehicles",
        'listAllUsersVehicles',
        false,
        500,
      );
    }
  }
}
