import { ApiMailingCallService } from 'src/modules/v2ApiCall/api.call.service/mailing';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { DEFAULT_COMPANY_NAME } from 'src/types/clientApplication';
import { EntityEnum, keys as UserKeys, User, UserType } from 'src/types/user';
import ErrorService from 'src/utils/errorService';
import execRetry from 'src/utils/retry';

import { Injectable } from '@nestjs/common';
import { MailDto } from '../email.dto';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

@Injectable()
export class EmailService {
  constructor(
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiMailingCallService: ApiMailingCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {}

  fetchMailTemplates(tenantId: string, key: string): Promise<any[]> {
    return this.apiMetadataCallService.fetchMailTemplates(tenantId, key);
  }

  async upsertTemplates(tenantId: string, mails: MailDto[]): Promise<any[]> {
    return this.apiMetadataCallService.upsertTemplates(
      mails.map((mail) => ({ ...mail, tenantId })),
    );
  }

  async invite(
    tenantId: string,
    tenantName: string,
    inviteeId: string,
    email: string,
    inviter: User,
    userExists: boolean,
    authToken: string,
  ) {
    try {
      let invitee: User;
      if (email) {
        const usersWithSameEmail: Array<User> =
          await this.apiEntityCallService.fetchFilteredEntities(
            tenantId,
            EntityEnum.email,
            email,
            true, // includeWallets
          );
        if (usersWithSameEmail.length <= 0) {
          ErrorService.throwError(`no user with email=${email} was found`);
        }
        invitee = usersWithSameEmail[0];
      } else {
        invitee = await this.apiEntityCallService.fetchEntity(
          tenantId,
          inviteeId,
          true,
        );
      }

      const allowedInviterTypes: Array<UserType> = [
        UserType.SUPERADMIN,
        UserType.ADMIN,
      ];

      let retriedClosure;
      if (invitee[UserKeys.USER_TYPE] === UserType.ADMIN) {
        retriedClosure = () => {
          return this.apiMailingCallService.sendPlatformInviteAdminMail(
            tenantId,
            tenantName || DEFAULT_COMPANY_NAME,
            invitee,
            userExists,
            authToken,
          );
        };
      } else if (invitee[UserKeys.USER_TYPE] === UserType.ISSUER) {
        if (userExists) {
          retriedClosure = () => {
            return this.apiMailingCallService.sendPlatformInviteAdminMail(
              tenantId,
              tenantName || DEFAULT_COMPANY_NAME,
              invitee,
              userExists,
              authToken,
            );
          };
        } else {
          retriedClosure = () => {
            this.apiMailingCallService.sendPlatformInviteIssuerMail(
              tenantId,
              invitee,
              authToken,
            );
          };
        }
      } else if (invitee[UserKeys.USER_TYPE] === UserType.INVESTOR) {
        allowedInviterTypes.push(UserType.ISSUER);
        allowedInviterTypes.push(UserType.UNDERWRITER);
        allowedInviterTypes.push(UserType.BROKER);
        retriedClosure = () => {
          return this.apiMailingCallService.sendPlatformInviteInvestorMail(
            tenantId,
            inviter,
            invitee,
            authToken,
          );
        };
      } else if (
        invitee[UserKeys.USER_TYPE] === UserType.UNDERWRITER ||
        invitee[UserKeys.USER_TYPE] === UserType.BROKER ||
        invitee[UserKeys.USER_TYPE] === UserType.AGENT ||
        invitee[UserKeys.USER_TYPE] === UserType.VERIFIER ||
        invitee[UserKeys.USER_TYPE] === UserType.NAV_MANAGER ||
        invitee[UserKeys.USER_TYPE] === UserType.NOTARY
      ) {
        allowedInviterTypes.push(UserType.ISSUER);
        retriedClosure = () => {
          this.apiMailingCallService.sendPlatformInviteInvestorMail(
            tenantId,
            inviter,
            invitee,
            authToken,
          );
        };
      } else {
        ErrorService.throwError(
          `invalid user type: invitation email can only be sent to users of type ${UserType.ADMIN}, ${UserType.ISSUER}, ${UserType.UNDERWRITER}, ${UserType.BROKER},${UserType.AGENT}, ${UserType.NOTARY} or ${UserType.INVESTOR}`,
        );
      }

      if (!allowedInviterTypes.includes(inviter[UserKeys.USER_TYPE])) {
        ErrorService.throwError(
          `invalid user type: users of type ${
            invitee[UserKeys.USER_TYPE]
          } can only be invited by users of type ${JSON.stringify(
            allowedInviterTypes,
          )} (${inviter[UserKeys.USER_TYPE]} instead)`,
        );
      }

      await execRetry(retriedClosure, 3, 1500, 1);

      const updates = {
        data: {
          ...invitee?.[UserKeys.DATA],
          registrationEmailSent: true,
        },
      };

      await this.apiEntityCallService.patchEntity(
        tenantId,
        invitee[UserKeys.USER_ID],
        updates,
      );

      return {
        message: `Registration link successfully sent to user ${
          invitee[UserKeys.USER_ID]
        } per email ${invitee[UserKeys.EMAIL]}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'invite user',
        'invite',
        true,
        500,
      );
    }
  }
}
