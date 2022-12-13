import {
  Controller,
  Post,
  Body,
  HttpCode,
  Get,
  Query,
  ParseArrayPipe,
  HttpStatus,
  UseFilters,
} from '@nestjs/common';
import { keys as ConfigKeys, Config, TENANT_FLAG } from 'src/types/config';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { EmailService } from './email.service';
import { TenantType } from 'src/types/clientApplication';
import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';

import ErrorService from 'src/utils/errorService';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import {
  SendInvitationEmailBodyInput,
  SendInvitationEmailOutput,
  FindMailsQuery,
  MailDto,
} from './email.dto';
import { checkUserType } from 'src/utils/checks/userType';
import { User, UserType, keys as UserKeys } from 'src/types/user';
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';

@Controller('v2/email')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
  ) {}

  @Post('/invite')
  @HttpCode(200)
  @Protected(true, [])
  async sendInvitationEmail(
    @UserContext() userContext: IUserContext,
    @Body() emailBody: SendInvitationEmailBodyInput,
  ): Promise<SendInvitationEmailOutput> {
    try {
      // super admin is allowed to send invite email to any tenant
      if (
        emailBody.tenantId &&
        userContext[UserContextKeys.USER][UserKeys.USER_TYPE] ===
          UserType.SUPERADMIN
      ) {
        await this.emailService.invite(
          emailBody.tenantId,
          emailBody.tenantName,
          emailBody.recipientId,
          emailBody.email,
          userContext[UserContextKeys.USER],
          true,
          userContext[UserContextKeys.AUTH_TOKEN],
        );
      } else {
        await this.emailService.invite(
          userContext[UserContextKeys.TENANT_ID],
          emailBody.tenantName,
          emailBody.recipientId,
          emailBody.email,
          userContext[UserContextKeys.USER],
          false,
          userContext[UserContextKeys.AUTH_TOKEN],
        );
      }

      return {
        message: 'Invitation email successfully sent',
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'sending invitation email',
        'sendInvitationEmail',
        true,
        500,
      );
    }
  }

  @Get('/templates')
  @HttpCode(200)
  @Protected(true, [])
  fetchMailTemplates(
    @UserContext() userContext: IUserContext,
    @Query() query: FindMailsQuery,
  ): Promise<any[]> {
    try {
      return this.emailService.fetchMailTemplates(
        userContext[UserContextKeys.TENANT_ID],
        query.key,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'fetching mail templates',
        'fetchMailTemplates',
        true,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/templates')
  @HttpCode(200)
  @Protected(true, [])
  async upsertTemplates(
    @UserContext() userContext: IUserContext,
    @Body(new ParseArrayPipe({ items: MailDto })) mails: MailDto[],
  ): Promise<any[]> {
    try {
      // Retrieve user with authId
      const user: User = userContext[UserContextKeys.USER];

      const tenantConfigs: Array<Config> =
        await this.apiMetadataCallService.fetchConfig(
          userContext[UserContextKeys.TENANT_ID],
          TENANT_FLAG,
        );

      let tenantConfigurationCanBeUpdated: boolean;
      let tenantType: TenantType;

      if (
        tenantConfigs &&
        tenantConfigs.length > 0 &&
        tenantConfigs[0] &&
        tenantConfigs[0][ConfigKeys.DATA] &&
        tenantConfigs[0][ConfigKeys.DATA][ConfigKeys.DATA__TENANT_TYPE]
      ) {
        tenantType =
          tenantConfigs[0][ConfigKeys.DATA][ConfigKeys.DATA__TENANT_TYPE];

        if (tenantType === TenantType.PLATFORM_SINGLE_ISSUER) {
          if (
            user[UserKeys.USER_TYPE] === UserType.SUPERADMIN ||
            user[UserKeys.USER_TYPE] === UserType.ADMIN ||
            user[UserKeys.USER_TYPE] === UserType.ISSUER
          ) {
            tenantConfigurationCanBeUpdated = true;
          }
        } else {
          if (
            user[UserKeys.USER_TYPE] === UserType.SUPERADMIN ||
            user[UserKeys.USER_TYPE] === UserType.ADMIN
          ) {
            tenantConfigurationCanBeUpdated = true;
          }
        }
      } else {
        // NO CONFIG WAS FOUND FOR THIS TENANT
        // This shall never happen but occured on Carbon project
        // In this case, we authorize config creation
        if (
          user[UserKeys.USER_TYPE] === UserType.SUPERADMIN ||
          user[UserKeys.USER_TYPE] === UserType.ADMIN
        ) {
          tenantConfigurationCanBeUpdated = true;
        }
      }

      if (!tenantConfigurationCanBeUpdated) {
        ErrorService.throwError(
          `user of type ${
            user[UserKeys.USER_TYPE]
          } is not allowed to update mail templates of tenant with ID ${
            userContext[UserContextKeys.TENANT_ID]
          }, because tenant type is ${tenantType}`,
        );
      }
      return this.emailService.upsertTemplates(
        userContext[UserContextKeys.TENANT_ID],
        mails,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'upserting mail templates',
        'upsertTemplates',
        true,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/invite/underwriter')
  @HttpCode(200)
  @Protected(true, [])
  async sendUserInvitationEmailAsUnderwriter(
    @UserContext() userContext: IUserContext,
    @Body() emailBody: SendInvitationEmailBodyInput,
  ): Promise<SendInvitationEmailOutput> {
    try {
      checkUserType(UserType.UNDERWRITER, userContext[UserContextKeys.USER]);

      await this.emailService.invite(
        userContext[UserContextKeys.TENANT_ID],
        emailBody.tenantName,
        emailBody.recipientId,
        emailBody.email,
        userContext[UserContextKeys.USER],
        false,
        userContext[UserContextKeys.AUTH_TOKEN],
      );

      return {
        message: `Invitation email successfully sent to user with ID ${emailBody.recipientId}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'sending user invitation email, as underwriter',
        'sendUserInvitationEmailAsUnderwriter',
        true,
        500,
      );
    }
  }

  @Post('/invite/broker')
  @HttpCode(200)
  @Protected(true, [])
  async sendUserInvitationEmailAsBroker(
    @UserContext() userContext: IUserContext,
    @Body() emailBody: SendInvitationEmailBodyInput,
  ): Promise<SendInvitationEmailOutput> {
    try {
      checkUserType(UserType.BROKER, userContext[UserContextKeys.USER]);

      await this.emailService.invite(
        userContext[UserContextKeys.TENANT_ID],
        emailBody.tenantName,
        emailBody.recipientId,
        emailBody.email,
        userContext[UserContextKeys.USER],
        false,
        userContext[UserContextKeys.AUTH_TOKEN],
      );

      return {
        message: `Invitation email successfully sent to user with ID ${emailBody.recipientId}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'sending user invitation email, as broker',
        'sendUserInvitationEmailAsBroker',
        true,
        500,
      );
    }
  }
}
