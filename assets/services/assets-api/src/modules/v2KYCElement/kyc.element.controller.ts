import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  HttpCode,
  Body,
  Param,
  UseFilters,
} from '@nestjs/common';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';
import { ElementEnum } from 'src/old/constants/enum';
import { ApiKycCallService } from '../v2ApiCall/api.call.service/kyc';

import ErrorService from 'src/utils/errorService';
import {
  ListAllElementsOutput,
  CreateElementOutput,
  RetrieveElementOutput,
  RetrieveElementParamInput,
  UpdateElementParamInput,
  UpdateElementBodyInput,
  UpdateElementOutput,
  DeleteElementParamInput,
  DeleteElementOutput,
} from './kyc.element.dto';
import { keys as KycElementKeys, KycElement } from 'src/types/kyc/element';
import { keys as UserKeys, UserType } from 'src/types/user';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';

@Controller('v2/essentials/kyc/element')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class KYCEssentialElementController {
  constructor(private readonly apiKycCallService: ApiKycCallService) {}

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async listAllElements(
    @UserContext() userContext: IUserContext,
  ): Promise<ListAllElementsOutput> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      const kycElements: Array<KycElement> =
        await this.apiKycCallService.listAllKycElements(
          userContext[UserContextKeys.TENANT_ID],
        );

      const response = {
        elements: kycElements,
        message: `${kycElements.length} KYC element(s) listed successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all elements',
        'listAllElements',
        true,
        500,
      );
    }
  }

  @Post()
  @HttpCode(201)
  @Protected(true, [])
  async createElement(
    @UserContext() userContext: IUserContext,
    @Body() kycElementsToCreate: Array<KycElement>,
  ): Promise<CreateElementOutput> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      const kycElementCreationResponses: Array<[KycElement, boolean]> =
        await this.apiKycCallService.createKycElements(
          userContext[UserContextKeys.TENANT_ID],
          kycElementsToCreate,
        );

      const formattedElements = kycElementCreationResponses.map(
        (kycElementCreationResponse) => {
          return {
            element: kycElementCreationResponse[0],
            newElement: kycElementCreationResponse[1],
          };
        },
      );

      const response: CreateElementOutput = {
        elements: formattedElements,
        message: `${formattedElements.length} KYC element(s) created successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating element',
        'createElement',
        true,
        500,
      );
    }
  }

  @Get('/:elementId')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveElement(
    @UserContext() userContext: IUserContext,
    @Param() elementParam: RetrieveElementParamInput,
  ): Promise<RetrieveElementOutput> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      const kycElement: KycElement =
        await this.apiKycCallService.retrieveKycElement(
          userContext[UserContextKeys.TENANT_ID],
          ElementEnum.elementId,
          elementParam.elementId,
          true,
        );

      const response: RetrieveElementOutput = {
        element: kycElement,
        message: `KYC element ${
          kycElement[KycElementKeys.ELEMENT_ID]
        } retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving element',
        'retrieveElement',
        true,
        500,
      );
    }
  }

  @Put('/:elementId')
  @HttpCode(200)
  @Protected(true, [])
  async updateElement(
    @UserContext() userContext: IUserContext,
    @Param() elementParam: UpdateElementParamInput,
    @Body() elementBody: UpdateElementBodyInput,
  ): Promise<UpdateElementOutput> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      // Check if KYC element exists, before updating it
      const existingKycElement: KycElement =
        await this.apiKycCallService.retrieveKycElement(
          userContext[UserContextKeys.TENANT_ID],
          ElementEnum.elementId,
          elementParam.elementId,
          true,
        );

      if (
        existingKycElement?.[KycElementKeys.ELEMENT_TENANT_ID] === 'codefi' &&
        userContext[UserContextKeys.USER][UserKeys.USER_TYPE] !==
          UserType.SUPERADMIN
      ) {
        ErrorService.throwError(
          `only a user of type ${UserType.SUPERADMIN} can update a 'public' KYC element, e.g. a KYC element with 'codefi' as tenantId`,
        );
      }

      const kycElement = await this.apiKycCallService.updateKycElement(
        userContext[UserContextKeys.TENANT_ID],
        elementParam.elementId,
        elementBody.updatedParameters,
      );

      const response: UpdateElementOutput = {
        element: kycElement,
        message: `KYC element ${
          kycElement[KycElementKeys.ELEMENT_ID]
        } updated successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating element',
        'updateElement',
        true,
        500,
      );
    }
  }

  @Delete('/:elementId')
  @HttpCode(200)
  @Protected(true, [])
  async deleteElement(
    @UserContext() userContext: IUserContext,
    @Param() elementParam: DeleteElementParamInput,
  ): Promise<DeleteElementOutput> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      // Check if KYC element exists, before deleting it
      const existingKycElement: KycElement =
        await this.apiKycCallService.retrieveKycElement(
          userContext[UserContextKeys.TENANT_ID],
          ElementEnum.elementId,
          elementParam.elementId,
          true,
        );

      if (
        existingKycElement?.[KycElementKeys.ELEMENT_TENANT_ID] === 'codefi' &&
        userContext[UserContextKeys.USER][UserKeys.USER_TYPE] !==
          UserType.SUPERADMIN
      ) {
        ErrorService.throwError(
          `only a user of type ${UserType.SUPERADMIN} can update a 'public' KYC element, e.g. a KYC element with 'codefi' as tenantId`,
        );
      }

      await this.apiKycCallService.deleteKycElement(
        userContext[UserContextKeys.TENANT_ID],
        elementParam.elementId,
      );

      const response: DeleteElementOutput = {
        message: `KYC element ${elementParam.elementId} deleted successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting element',
        'deleteElement',
        true,
        500,
      );
    }
  }
}
