import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  UseFilters,
} from '@nestjs/common';

import {
  RetrieveOfferParamInput,
  RetrieveOfferOutput,
  ListAllOffersOutput,
  ListAllOffersQueryInput,
  MAX_OFFERS_COUNT,
  RetrieveOfferQueryInput,
} from './offer.dto';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';

import ErrorService from 'src/utils/errorService';

import {
  keys as OfferKeys,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import { Offer } from 'src/types/workflow/workflowInstances/offer';
import { setToLowerCase } from 'src/utils/case';
import { OfferService } from './offer.service';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { Protected } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';
import { validateSorting } from 'src/utils/checks/v2Sorts';
import { SortCriteria } from '../v2ApiCall/api.call.service/query';

@Controller('v2/essentials/digital/asset/offer')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class OfferController {
  constructor(
    private readonly offerService: OfferService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
  ) {}

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async listAllOffers(
    @UserContext() userContext: IUserContext,
    @Query() offerQuery: ListAllOffersQueryInput,
  ): Promise<ListAllOffersOutput> {
    try {
      const offset = Number(offerQuery.offset || 0);
      const limit: number = Math.min(
        Number(offerQuery.limit || MAX_OFFERS_COUNT),
        MAX_OFFERS_COUNT,
      );

      // Extract tokenIds filter from query param
      let tokenIds: Array<string>;
      if (offerQuery.tokenIds) {
        tokenIds = JSON.parse(offerQuery.tokenIds);
        if (!(tokenIds && Array.isArray(tokenIds))) {
          ErrorService.throwError(
            'Invalid input for tokenIds. Shall be a stringified array.',
          );
        }
      }

      // Extract states filter from query param
      let states: Array<string>;
      if (offerQuery.states) {
        states = JSON.parse(offerQuery.states);
        if (!(states && Array.isArray(states))) {
          ErrorService.throwError(
            'Invalid input for states. Shall be a stringified array.',
          );
        }
      }

      // Extract functionNames filter from query param
      let functionNames: Array<string>;
      if (offerQuery.functionNames) {
        functionNames = JSON.parse(offerQuery.functionNames);
        if (!(functionNames && Array.isArray(functionNames))) {
          ErrorService.throwError(
            'Invalid input for functionNames. Shall be a stringified array.',
          );
        }
      }

      // Extract userIds filter from query param
      let userIds: Array<string>;
      if (offerQuery.userIds) {
        userIds = JSON.parse(offerQuery.userIds);
        if (!(userIds && Array.isArray(userIds))) {
          ErrorService.throwError(
            'Invalid input for userIds. Shall be a stringified array.',
          );
        }
      }

      // Extract dates filter from query param
      let stringDates: Array<string>;
      if (offerQuery.dates) {
        stringDates = JSON.parse(offerQuery.dates);
        if (!(stringDates && Array.isArray(stringDates))) {
          ErrorService.throwError(
            'Invalid input for dates. Shall be a stringified array.',
          );
        }
      }
      const dates: Array<Date> = stringDates
        ? stringDates.map((stringDate: string) => new Date(stringDate))
        : undefined;

      let sorts: Array<SortCriteria>;
      if (offerQuery.sorts) {
        sorts = JSON.parse(offerQuery.sorts);
        validateSorting(sorts);
      }

      const offersList: Array<Offer> = await this.offerService.listAllOffers(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER],
        offerQuery.issuerId,
        offerQuery.tokenId,
        tokenIds,
        states,
        functionNames,
        userIds,
        dates,
        sorts,
      );

      const filteredOffersList: Array<Offer> =
        offerQuery.tokenId && offerQuery.assetClass
          ? offersList.filter((currentOffer: Offer) => {
              return (
                currentOffer[OfferKeys.ASSET_CLASS] ===
                setToLowerCase(offerQuery.assetClass)
              );
            })
          : offersList;

      const slicedOffersList: Array<Offer> = filteredOffersList.slice(
        offset,
        Math.min(offset + limit, filteredOffersList.length),
      );

      const slicedOffersListWithMetadata: Array<Offer> =
        await this.apiMetadataCallService.addMetadataToWorkflowInstances(
          userContext[UserContextKeys.TENANT_ID],
          slicedOffersList,
          offerQuery.withAssetData, // withAssetData
        );

      const response: ListAllOffersOutput = {
        offers: slicedOffersListWithMetadata,
        count: slicedOffersListWithMetadata.length,
        total: filteredOffersList.length,
        message: `${
          slicedOffersListWithMetadata.length
        } offer(s) listed successfully for user ${
          userContext[UserContextKeys.USER_ID]
        }${
          offerQuery.tokenId
            ? `, filtered for ${
                offerQuery.assetClass
                  ? `asset class ${setToLowerCase(offerQuery.assetClass)} of`
                  : ''
              } token ${offerQuery.tokenId}`
            : ''
        }`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing offers',
        'listAllOffers',
        true,
        500,
      );
    }
  }

  @Get(':offerIndex')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveOffer(
    @UserContext() userContext: IUserContext,
    @Param() offerParam: RetrieveOfferParamInput,
    @Query() offerQuery: RetrieveOfferQueryInput,
  ): Promise<RetrieveOfferOutput> {
    try {
      const offer: Offer = await this.offerService.retrieveOffer(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER],
        offerParam.offerIndex,
      );

      if (!offer || offer[OfferKeys.TYPE] !== WorkflowType.OFFER) {
        ErrorService.throwError(
          `workflow instance with ID ${
            offer[OfferKeys.ID]
          } was found, but is not an offer (${offer[OfferKeys.TYPE]} instead)`,
        );
      }

      const fetchedOfferWithMetadata: Offer = (
        await this.apiMetadataCallService.addMetadataToWorkflowInstances(
          userContext[UserContextKeys.TENANT_ID],
          [offer],
          offerQuery.withAssetData, // withAssetData
        )
      )[0];

      const response: RetrieveOfferOutput = {
        offer: fetchedOfferWithMetadata,
        message: `Offer with index ${
          fetchedOfferWithMetadata[OfferKeys.ID]
        } retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving offer',
        'retrieveOffer',
        true,
        500,
      );
    }
  }
}
