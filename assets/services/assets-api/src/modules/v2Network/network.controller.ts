import {
  Controller,
  Get,
  HttpCode,
  Post,
  Body,
  Query,
  Param,
  Delete,
  Req,
  UseFilters,
} from '@nestjs/common';

import { Request } from 'express';

import { NetworkService } from './network.service';

import ErrorService from 'src/utils/errorService';

import {
  ListAllNetworksOutput,
  NetworkBodyInput,
  NetworkOutput,
  NetworksGetRequest,
  ListNetworksOutput,
  DeleteNetworkParamInput,
  RetrieveNetworkOutput,
} from './network.dto';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';
import { keys as UserKeys, UserType } from 'src/types/user';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import {
  ApiBearerAuth,
  ApiOAuth2,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { extractAuthTokenFromRequest } from 'src/utils/jwtUtils';
import { Protected, M2mTokenService } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';
import config from '../../config';
import { IHeaders } from '@codefi-assets-and-payments/nestjs-orchestrate';

const M2M_TOKEN_CLIENT_ID = config().m2mToken.client.id;
const M2M_TOKEN_CLIENT_SECRET = config().m2mToken.client.secret;
const M2M_TOKEN_AUDIENCE = config().m2mToken.audience;

@ApiTags('Networks')
@ApiBearerAuth('access-token')
@Controller('v2/essentials/network')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class NetworkController {
  constructor(
    private readonly networkService: NetworkService,
    private m2mTokenService: M2mTokenService,
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOAuth2(['read:network'])
  @ApiOperation({ summary: 'List all networks' })
  @Protected(true, [])
  async listAllNetworks(
    @UserContext() userContext: IUserContext,
  ): Promise<ListAllNetworksOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: ListAllNetworksOutput =
        await this.networkService.listAllNetworks(
          userContext[UserContextKeys.TENANT_ID],
        );
      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing networks',
        'listAllNetworks',
        true,
        500,
      );
    }
  }

  @Get('all')
  @HttpCode(200)
  @ApiOAuth2(['read:network'])
  @ApiOperation({ summary: 'List all networks from Network API' })
  @Protected(true, [])
  async getAllNetworks(
    @UserContext() userContext: IUserContext,
    @Query() networkQuery: NetworksGetRequest,
    @Req() req: Request,
  ): Promise<ListNetworksOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      let authToken: string;

      // If superadmin, create a superadmin M2M token (the one with "*" as tenant Id)
      // so that it will be used as a bearer token to call Network API and to have access to all
      // Orchestrate resources/networks
      if (
        userContext[UserContextKeys.USER][UserKeys.USER_TYPE] ===
        UserType.SUPERADMIN
      ) {
        authToken = await this.m2mTokenService.createM2mToken(
          M2M_TOKEN_CLIENT_ID,
          M2M_TOKEN_CLIENT_SECRET,
          M2M_TOKEN_AUDIENCE,
        );
      } else {
        authToken = extractAuthTokenFromRequest(req);
      }

      const response: ListNetworksOutput =
        await this.networkService.getNetworks(authToken, networkQuery.key);
      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'Getting networks',
        'get',
        true,
        error.status,
        error.response?.downstreamStatus,
      );
    }
  }

  @Get(':key')
  @HttpCode(200)
  @ApiOAuth2(['read:network'])
  @ApiOperation({ summary: 'List a network by key from Network API' })
  @Protected(true, [])
  async retrieveNetwork(
    @UserContext() userContext: IUserContext,
    @Param('key') key: string,
    @Req() req: Request,
  ): Promise<RetrieveNetworkOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      let authToken: string;

      // If superadmin, create a superadmin M2M token (the one with "*" as tenant Id)
      // so that it will be used as a bearer token to call Network API and to have access to all
      // Orchestrate resources/networks
      if (
        userContext[UserContextKeys.USER][UserKeys.USER_TYPE] ===
        UserType.SUPERADMIN
      ) {
        authToken = await this.m2mTokenService.createM2mToken(
          M2M_TOKEN_CLIENT_ID,
          M2M_TOKEN_CLIENT_SECRET,
          M2M_TOKEN_AUDIENCE,
        );
      } else {
        authToken = extractAuthTokenFromRequest(req);
      }

      const response: RetrieveNetworkOutput =
        await this.networkService.getNetwork(authToken, key);
      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'Retrieving network',
        'Retrieve',
        true,
        error.status,
        error.response?.downstreamStatus,
      );
    }
  }

  @Delete(':key')
  @HttpCode(200)
  @ApiOAuth2(['delete:network'])
  @ApiOperation({ summary: 'Delete a network' })
  @Protected(true, [])
  async deleteNetwork(
    @UserContext() userContext: IUserContext,
    @Param() networkParam: DeleteNetworkParamInput,
  ): Promise<{ message: string }> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const superUserAuthToken: string =
        await this.m2mTokenService.createM2mToken(
          M2M_TOKEN_CLIENT_ID,
          M2M_TOKEN_CLIENT_SECRET,
          M2M_TOKEN_AUDIENCE,
        );

      const deletedNetworkResponse = await this.networkService.deleteNetwork(
        networkParam.key,
        superUserAuthToken,
      );

      return deletedNetworkResponse;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'Deleting network',
        'delete',
        true,
        error.status,
        error.response?.downstreamStatus,
      );
    }
  }

  @Post('')
  @HttpCode(202)
  @Protected(true, [])
  async createNetwork(
    @UserContext() userContext: IUserContext,
    @Body() networkBody: NetworkBodyInput,
  ): Promise<NetworkOutput> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const superUserAuthToken: string =
        await this.m2mTokenService.createM2mToken(
          M2M_TOKEN_CLIENT_ID,
          M2M_TOKEN_CLIENT_SECRET,
          M2M_TOKEN_AUDIENCE,
        );

      const headers: IHeaders = {
        'X-Tenant-ID': networkBody.tenantId,
      };

      const networkResponse: NetworkOutput = { network: null, message: '' };

      networkResponse.message =
        'Creation of network has been successfully requested (message sent)';

      networkResponse.network = await this.networkService.createNetwork(
        networkBody,
        superUserAuthToken,
        headers,
      );

      return networkResponse;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'Registering network',
        'register',
        true,
        error.status,
        error.response?.downstreamStatus,
      );
    }
  }
}
