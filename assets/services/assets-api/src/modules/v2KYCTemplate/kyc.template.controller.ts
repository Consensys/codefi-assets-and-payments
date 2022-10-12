import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  Param,
  HttpCode,
  UseFilters,
} from '@nestjs/common';

import { KYCTemplateService } from './kyc.template.service';

import ErrorService from 'src/utils/errorService';
import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';

import { keys as UserKeys, User, UserType } from 'src/types/user';
import { TemplateEnum } from 'src/old/constants/enum';
import {
  ListAllTemplatesQueryInput,
  ListAllTemplatesOutput,
  CreateTemplateOutput,
  CreateTemplateBodyInput,
  RetrieveTemplateParamInput,
  DeleteTemplateOutput,
  UpdateTemplateOutput,
  UpdateTemplateParamInput,
  RetrieveTemplateOutput,
  RetrieveTemplatesQueryInput,
  UpdateTemplateBodyInput,
  DeleteTemplateParamInput,
} from './kyc.template.dto';
import {
  DEFAULT_KYC_TEMPLATE_NAME,
  keys as KycTemplateKeys,
  KycTemplate,
  RawKycTemplate,
} from 'src/types/kyc/template';
import { USER_ID_LENGTH } from 'src/types/user';
import { ApiKycCallService } from 'src/modules/v2ApiCall/api.call.service/kyc';
import { checkUserType, checkUserTypeIsOneOf } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { Protected } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';
import { ApiEntityCallService } from '../v2ApiCall/api.call.service/entity';

@Controller('v2/essentials/kyc/template')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class KYCEssentialTemplateController {
  constructor(
    private readonly kycTemplateService: KYCTemplateService,
    private readonly apiKycCallService: ApiKycCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {}

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async listAllTemplates(
    @UserContext() userContext: IUserContext,
    @Query() templateQuery: ListAllTemplatesQueryInput,
  ): Promise<ListAllTemplatesOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const user: User = userContext[UserContextKeys.USER];
      const kycTemplates: Array<KycTemplate | RawKycTemplate> =
        await this.kycTemplateService.listAllKycTemplates(
          userContext[UserContextKeys.TENANT_ID],
          templateQuery.includeElements,
        );
      const filteredKycTemplates: Array<KycTemplate | RawKycTemplate> =
        user[UserKeys.USER_TYPE] === UserType.SUPERADMIN ||
        user[UserKeys.USER_TYPE] === UserType.ADMIN
          ? kycTemplates
          : kycTemplates.filter((kycTemplate) => {
              if (
                kycTemplate[KycTemplateKeys.ISSUER_ID].length !== USER_ID_LENGTH
              ) {
                return true;
              } else {
                if (
                  kycTemplate[KycTemplateKeys.ISSUER_ID] ===
                  userContext[UserContextKeys.USER_ID]
                ) {
                  return true;
                } else {
                  return false;
                }
              }
            });

      const response: ListAllTemplatesOutput = {
        defaultTemplate: DEFAULT_KYC_TEMPLATE_NAME,
        templates: filteredKycTemplates,
        message: `${filteredKycTemplates.length} KYC template(s) listed successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all templates',
        'listAllTemplates',
        true,
        500,
      );
    }
  }

  @Post()
  @HttpCode(201)
  @Protected(true, [])
  async createTemplate(
    @UserContext() userContext: IUserContext,
    @Body() templateBody: CreateTemplateBodyInput,
  ): Promise<CreateTemplateOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const user: User = await this.apiEntityCallService.fetchEntity(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER_ID],
        true,
      );

      const templateToCreate: CreateTemplateBodyInput = {
        ...templateBody,
      };
      if (
        user[UserKeys.USER_TYPE] !== UserType.SUPERADMIN &&
        user[UserKeys.USER_TYPE] !== UserType.ADMIN
      ) {
        templateToCreate[KycTemplateKeys.ISSUER_ID] =
          userContext[UserContextKeys.USER_ID];
      }

      await this.kycTemplateService.checkKycTemplateValidity(
        userContext[UserContextKeys.TENANT_ID],
        templateToCreate,
      );

      const [kycTemplate, newTemplate]: [RawKycTemplate, boolean] =
        await this.apiKycCallService.createKycTemplate(
          userContext[UserContextKeys.TENANT_ID],
          templateToCreate,
        );

      const response: CreateTemplateOutput = {
        template: kycTemplate,
        newTemplate: newTemplate,
        message: `KYC template ${kycTemplate[KycTemplateKeys.TEMPLATE_ID]} ${
          newTemplate ? 'created' : 'retrieved'
        } successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating template',
        'createTemplate',
        true,
        500,
      );
    }
  }

  @Get('/:templateId')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveTemplate(
    @UserContext() userContext: IUserContext,
    @Query() templateQuery: RetrieveTemplatesQueryInput,
    @Param() templateParam: RetrieveTemplateParamInput,
  ): Promise<RetrieveTemplateOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const user: User = await this.apiEntityCallService.fetchEntity(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER_ID],
        true,
      );

      const kycTemplate: KycTemplate | RawKycTemplate =
        await this.kycTemplateService.retrieveKycTemplate(
          userContext[UserContextKeys.TENANT_ID],
          templateParam.templateId,
          templateQuery.includeElements,
        );

      if (
        user[UserKeys.USER_TYPE] !== UserType.SUPERADMIN &&
        user[UserKeys.USER_TYPE] !== UserType.ADMIN &&
        kycTemplate[KycTemplateKeys.ISSUER_ID].length === USER_ID_LENGTH &&
        kycTemplate[KycTemplateKeys.ISSUER_ID] !==
          userContext[UserContextKeys.USER_ID]
      ) {
        ErrorService.throwError(
          `only the template creator(${
            kycTemplate[KycTemplateKeys.ISSUER_ID]
          }) or an ADMIN can retrieve the template`,
        );
      }

      const response: RetrieveTemplateOutput = {
        template: kycTemplate,
        message: `KYC template ${
          kycTemplate[KycTemplateKeys.TEMPLATE_ID]
        } retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving template',
        'retrieveTemplate',
        true,
        500,
      );
    }
  }

  @Put('/:templateId')
  @HttpCode(200)
  @Protected(true, [])
  async updateTemplate(
    @UserContext() userContext: IUserContext,
    @Param() templateParam: UpdateTemplateParamInput,
    @Body() templateBody: UpdateTemplateBodyInput,
  ): Promise<UpdateTemplateOutput> {
    try {
      checkUserTypeIsOneOf(
        [UserType.SUPERADMIN, UserType.ADMIN, UserType.ISSUER],
        userContext[UserContextKeys.USER],
      );

      const user: User = await this.apiEntityCallService.fetchEntity(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER_ID],
        true,
      );

      const rawKycTemplate: RawKycTemplate =
        await this.apiKycCallService.retrieveKycTemplate(
          userContext[UserContextKeys.TENANT_ID],
          TemplateEnum.templateId,
          templateParam.templateId,
          true,
        );

      if (
        user[UserKeys.USER_TYPE] !== UserType.SUPERADMIN &&
        user[UserKeys.USER_TYPE] !== UserType.ADMIN &&
        rawKycTemplate[KycTemplateKeys.ISSUER_ID] !==
          userContext[UserContextKeys.USER_ID]
      ) {
        ErrorService.throwError(
          `only the template creator(${
            rawKycTemplate[KycTemplateKeys.ISSUER_ID]
          }) or an ADMIN can update the template`,
        );
      }

      const updatedKycTemplate = {
        [KycTemplateKeys.ISSUER_ID]: rawKycTemplate[KycTemplateKeys.ISSUER_ID],
        [KycTemplateKeys.NAME]: rawKycTemplate[KycTemplateKeys.NAME],
        [KycTemplateKeys.TOP_SECTIONS]:
          rawKycTemplate[KycTemplateKeys.TOP_SECTIONS],
        [KycTemplateKeys.DATA]: rawKycTemplate[KycTemplateKeys.DATA],
      };
      if (templateBody.updatedParameters[KycTemplateKeys.NAME]) {
        updatedKycTemplate[KycTemplateKeys.NAME] =
          templateBody.updatedParameters[KycTemplateKeys.NAME];
      }
      if (templateBody.updatedParameters[KycTemplateKeys.TOP_SECTIONS]) {
        updatedKycTemplate[KycTemplateKeys.TOP_SECTIONS] =
          templateBody.updatedParameters[KycTemplateKeys.TOP_SECTIONS];
      }
      if (templateBody.updatedParameters[KycTemplateKeys.DATA]) {
        updatedKycTemplate[KycTemplateKeys.DATA] =
          templateBody.updatedParameters[KycTemplateKeys.DATA];
      }

      await this.kycTemplateService.checkKycTemplateValidity(
        userContext[UserContextKeys.TENANT_ID],
        updatedKycTemplate,
      );

      const kycTemplate: RawKycTemplate =
        await this.apiKycCallService.updateKycTemplate(
          userContext[UserContextKeys.TENANT_ID],
          templateParam.templateId,
          updatedKycTemplate,
        );

      const response: UpdateTemplateOutput = {
        template: kycTemplate,
        message: `KYC template ${
          kycTemplate[KycTemplateKeys.TEMPLATE_ID]
        } updated successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating template',
        'updateTemplate',
        true,
        500,
      );
    }
  }

  @Delete('/:templateId')
  @HttpCode(200)
  @Protected(true, [])
  async deleteTemplate(
    @UserContext() userContext: IUserContext,
    @Param() templateParam: DeleteTemplateParamInput,
  ): Promise<DeleteTemplateOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const user: User = await this.apiEntityCallService.fetchEntity(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER_ID],
        true,
      );

      const rawKycTemplate: RawKycTemplate =
        await this.apiKycCallService.retrieveKycTemplate(
          userContext[UserContextKeys.TENANT_ID],
          TemplateEnum.templateId,
          templateParam.templateId,
          true,
        );

      if (
        user[UserKeys.USER_TYPE] !== UserType.SUPERADMIN &&
        user[UserKeys.USER_TYPE] !== UserType.ADMIN &&
        rawKycTemplate[KycTemplateKeys.ISSUER_ID] !==
          userContext[UserContextKeys.USER_ID]
      ) {
        ErrorService.throwError(
          `only the template creator(${
            rawKycTemplate[KycTemplateKeys.ISSUER_ID]
          }) or an ADMIN can delete the template`,
        );
      }

      await this.apiKycCallService.deleteKycTemplate(
        userContext[UserContextKeys.TENANT_ID],
        templateParam.templateId,
      );

      const response: DeleteTemplateOutput = {
        message: `KYC template ${templateParam.templateId} deleted successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting template',
        'deleteTemplate',
        true,
        500,
      );
    }
  }
}
