import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { UserType, User, ReducedUser } from 'src/types/user';

import { keys as UserKeys } from 'src/types/user';

import { LinkService } from 'src/modules/v2Link/link.service';

import { EntityType } from 'src/types/entity';

import { UserListingService } from './listAllUsers';

@Injectable()
export class UserHelperService {
  constructor(
    private readonly linkService: LinkService,
    private readonly userListingService: UserListingService,
  ) {}
  /**
   * [Format issuer]
   * This function is showed to keep only data that can be shared with investors
   */
  formatIssuer(issuer: User, issuerAddress: string): ReducedUser {
    try {
      return {
        [UserKeys.USER_ID]: issuer[UserKeys.USER_ID],
        [UserKeys.FIRST_NAME]: issuer[UserKeys.FIRST_NAME],
        [UserKeys.LAST_NAME]: issuer[UserKeys.LAST_NAME],
        [UserKeys.EMAIL]: issuer[UserKeys.EMAIL],
        [UserKeys.LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID]:
          issuer[UserKeys.LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID],
        [UserKeys.ADDRESS]: issuerAddress,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'formatting issuer',
        'formatIssuer',
        false,
        500,
      );
    }
  }

  checkUsersCanHoldTokensBatch(recipients: Array<User>) {
    try {
      recipients.map((recipient: any) => {
        this.checkUserCanHoldTokens(recipient);
      });
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if batch users can hold tokens',
        'checkUsersCanHoldTokensBatch',
        false,
        500,
      );
    }
  }

  checkUserCanHoldTokens(recipient: User) {
    try {
      if (!recipient) {
        ErrorService.throwError('check failure: recipient is not defined');
      }
      if (
        recipient[UserKeys.USER_TYPE] !== UserType.UNDERWRITER &&
        recipient[UserKeys.USER_TYPE] !== UserType.INVESTOR &&
        recipient[UserKeys.USER_TYPE] !== UserType.VEHICLE
      ) {
        ErrorService.throwError(
          `recipient has invalid type ${recipient[UserKeys.USER_TYPE]}`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if user can hold tokens',
        'checkUserCanHoldTokens',
        false,
        500,
      );
    }
  }

  async retrieveStrictUserEntityLinkIfExisting(
    tenantId: string,
    userId: string,
    userType: UserType,
    entityId: string,
    entityType: EntityType,
    assetClassKey: string,
  ) {
    try {
      return await this.linkService.retrieveStrictUserEntityLink(
        tenantId,
        userId,
        userType,
        entityId,
        entityType,
        assetClassKey,
      );
    } catch (error) {
      return;
    }
  }

  async isInvestorLinkedToThirdParty(
    tenantId: string,
    thirdPartyId: string,
    thirdPartyType: UserType,
    investorId: string,
  ): Promise<boolean> {
    const { users } =
      await this.userListingService.listAllInvestorsLinkedToThirdParty(
        tenantId,
        thirdPartyId,
        0, // offset
        Number.MAX_SAFE_INTEGER, // limit set as max integer in order to grab the whole user list
        thirdPartyType,
        undefined, // Filter users according to their userTypes
        undefined, // Filter users according to the state of their links
      );

    const foundUser = users.filter(
      (user: User) => user[UserKeys.USER_ID] === investorId,
    );

    return foundUser.length > 0;
  }
}
