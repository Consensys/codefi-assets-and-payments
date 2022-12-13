import { Injectable } from '@nestjs/common';

import { NestJSPinoLogger } from '@consensys/observability';

import ErrorService from 'src/utils/errorService';
import { Offer } from 'src/types/workflow/workflowInstances/offer';
import {
  BuyOrderType,
  keys as OfferKeys,
  keys as OrderKeys,
  OfferStatus,
  QuantityDistribution,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';

import { WorkflowInstanceService } from 'src/modules/v2WorkflowInstance/workflow.instance.service';
import { keys as UserKeys, User, UserType } from 'src/types/user';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { EntityType } from 'src/types/entity';
import { Project } from 'src/types/project';
import { Token } from 'src/types/token';
import { Config } from 'src/types/config';
import { WorkflowInstanceEnum } from 'src/old/constants/enum';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { getEnumValues } from 'src/utils/enumUtils';
import { OrderService } from 'src/modules/v2Order/order.service';
import { Order } from 'src/types/workflow/workflowInstances/order';
import { WorkflowName } from 'src/types/workflow/workflowTemplate';
import { getQueryFilters } from 'src/utils/checks/v2Filters';
import { SortCriteria } from 'src/modules/v2ApiCall/api.call.service/query';

@Injectable()
export class OfferService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly workflowInstanceService: WorkflowInstanceService,
    private readonly entityService: EntityService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly orderService: OrderService,
  ) {}

  /**
   * Retrieve list of offers
   */
  async listAllOffers(
    tenantId: string,
    user: User,
    issuerId: string, // optional
    tokenId: string, // optional
    tokenIds: Array<string>, // Optional filter (not taken into account in case tokenId is defined)
    workflowInstancesStates: Array<string>, // Optional filter
    functionNames: Array<string>, // Optional filter
    userIds: Array<string>, // Optional filter
    dates: Array<Date>, // Optional filter
    sorts?: Array<SortCriteria>,
  ): Promise<Array<Offer>> {
    try {
      let offersList: Array<Offer>;

      if (
        user[UserKeys.USER_TYPE] === UserType.SUPERADMIN ||
        user[UserKeys.USER_TYPE] === UserType.ADMIN ||
        user[UserKeys.USER_TYPE] === UserType.ISSUER
      ) {
        // In case the user is an a SUPERADMIN, an ADMIN, or an ISSUER, he can fetch all offers available for his tokens
        offersList =
          await this.workflowInstanceService.listAllWorkflowInstances(
            tenantId,
            WorkflowType.OFFER,
            undefined, // otherWorkflowType
            user,
            tokenId, // specific token or undefined for all tokens
            tokenIds,
            workflowInstancesStates,
            functionNames,
            userIds,
            dates,
            undefined, // Optional: V2 Filters
          );
      } else {
        // In case the user is an UNDERWRITER, a BROKER or an INVESTOR, he can fetch all offers available
        // inside a given "issuer space", but only if he's been on-boarded by the issuer

        let entityId: string;
        let entityType: EntityType;
        if (tokenId) {
          entityId = tokenId;
          entityType = EntityType.TOKEN;
        } else if (issuerId) {
          entityId = issuerId;
          entityType = EntityType.ISSUER;
        } else {
          ErrorService.throwError(
            'missing parameter: either "tokenId" or "issuerId need to be specified"',
          );
        }

        // Check if user has been on-boarded properly
        const [, issuer, ,]: [Project, User, Token, Config] =
          await this.entityService.retrieveEntityAsOnBoardedUser(
            tenantId,
            user,
            entityId,
            entityType,
          );

        const filters = getQueryFilters(
          user[UserKeys.USER_ID],
          workflowInstancesStates,
          functionNames,
          userIds,
          dates,
        );

        offersList =
          await this.workflowInstanceService.listAllWorkflowInstances(
            tenantId,
            WorkflowType.OFFER,
            undefined, // otherWorkflowType
            issuer, // Offers are fetched on behalf of an issuer (as we want a user to be able to access all offers, inside a given "issuer space")
            tokenId, // specific token or undefined for all tokens
            tokenIds,
            workflowInstancesStates,
            functionNames,
            userIds,
            dates,
            filters,
            sorts,
          );
      }
      return offersList;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all offers',
        'listAllOffers',
        false,
        500,
      );
    }
  }

  /**
   * Retrieve offer
   */
  async retrieveOffer(
    tenantId: string,
    user: User,
    offerId: number,
  ): Promise<Offer> {
    try {
      const offer: Offer = await this.workflowService.retrieveWorkflowInstances(
        tenantId,
        WorkflowInstanceEnum.id,
        offerId,
        undefined, // idempotencyKey
        undefined,
        undefined,
        undefined,
        undefined, // entityType
        undefined, // if querying by id, workflow-api doesn't use this param even if passed, expecting WorkflowType.OFFER
        undefined, // otherWorkflowType
        true,
      );

      // Check if user has been on-boarded properly
      await this.entityService.retrieveEntityAsOnBoardedUser(
        tenantId,
        user,
        offer[OfferKeys.ENTITY_ID],
        offer[OfferKeys.ENTITY_TYPE],
      );

      return offer;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving offer',
        'retrieveOffer',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve offer status]
   */
  retrieveOfferStatus(offerStatus: OfferStatus): OfferStatus {
    try {
      if (!offerStatus) {
        ErrorService.throwError(
          'shall never happen: offer status is not defined',
        );
      }

      const validOfferStatuses: Array<OfferStatus> = getEnumValues(OfferStatus);
      if (!validOfferStatuses.includes(offerStatus)) {
        ErrorService.throwError(
          `invalid offer status(${offerStatus}): shall be chosen amongst ${validOfferStatuses.join(
            ', ',
          )}`,
        );
      }

      return offerStatus;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving offer status',
        'retrieveOfferStatus',
        false,
        500,
      );
    }
  }

  /**
   * [Check offer validity]
   */
  checkOfferValidity(offer: Offer, quantity: number, orderType: BuyOrderType) {
    try {
      let actionStr;
      let offerEnableKey;
      switch (orderType) {
        case BuyOrderType.BID:
          actionStr = 'bid';
          offerEnableKey = OfferKeys.DATA__OFFER_ENABLE_BID_PRICE_ORDER;
          break;
        case BuyOrderType.PURCHASE:
          actionStr = 'purchase';
          offerEnableKey = OfferKeys.DATA__OFFER_ENABLE_AT_PRICE_ORDER;
          break;
        case BuyOrderType.ENQUIRE:
          actionStr = 'enquire';
          offerEnableKey = OfferKeys.DATA__OFFER_ENABLE_NEGOTIATION;
          break;
        default:
          break;
      }

      if (!actionStr || !offerEnableKey) {
        ErrorService.throwError(`the given orderType(${orderType}) is invalid`);
      }

      // Perform various checks on the offer object
      const offerStatus = offer[OfferKeys.DATA][OfferKeys.DATA__OFFER_STATUS];
      if (offerStatus !== OfferStatus.OPEN) {
        ErrorService.throwError(
          `status of offer with id ${offer[OfferKeys.ID]} needs to be set to ${
            OfferStatus.OPEN
          } to allow ${actionStr} (current status: ${offerStatus})`,
        );
      }

      const enabled = offer[OfferKeys.DATA][offerEnableKey];
      if (!enabled) {
        ErrorService.throwError(
          `offer with id ${
            offer[OfferKeys.ID]
          } does not allow ${actionStr} ('${offerEnableKey}' flag is set to ${enabled})`,
        );
      }

      const availableQuantity =
        offer[OfferKeys.DATA][OfferKeys.DATA__OFFER_QUANTITY_DISTRIBUTION][
          OfferKeys.QUANTITY_DISTRIBUTION_AVAILABLE
        ];

      if (quantity > availableQuantity) {
        ErrorService.throwError(
          `invalid ${actionStr} quantity: quantity(${quantity}) exceeds available offer quantity (${availableQuantity})`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking offer validity',
        'checkOfferValidity',
        false,
        500,
      );
    }
  }

  /**
   * [Update the token quantity distribution of an offer]
   */
  updateOfferQuantityDistribution(
    offer: Offer,
    purchasedQuantity: number,
    heldQuantity: number,
    initiateHold: boolean,
  ) {
    try {
      // Updating purchased quantity
      if (purchasedQuantity) {
        offer[OfferKeys.DATA][OfferKeys.DATA__OFFER_QUANTITY_DISTRIBUTION][
          OfferKeys.QUANTITY_DISTRIBUTION_PURCHASED
        ] += purchasedQuantity;

        // Ensuring purchased counter is not less than zero
        offer[OfferKeys.DATA][OfferKeys.DATA__OFFER_QUANTITY_DISTRIBUTION][
          OfferKeys.QUANTITY_DISTRIBUTION_PURCHASED
        ] = Math.max(
          offer[OfferKeys.DATA][OfferKeys.DATA__OFFER_QUANTITY_DISTRIBUTION][
            OfferKeys.QUANTITY_DISTRIBUTION_PURCHASED
          ],
          0,
        );
      }

      // Updating held quantity
      if (heldQuantity) {
        if (initiateHold) {
          offer[OfferKeys.DATA][OfferKeys.DATA__OFFER_QUANTITY_DISTRIBUTION][
            OfferKeys.QUANTITY_DISTRIBUTION_HELD
          ] += heldQuantity;
        } else {
          offer[OfferKeys.DATA][OfferKeys.DATA__OFFER_QUANTITY_DISTRIBUTION][
            OfferKeys.QUANTITY_DISTRIBUTION_HELD
          ] -= heldQuantity;
        }

        // Ensuring held counter is not less than zero
        offer[OfferKeys.DATA][OfferKeys.DATA__OFFER_QUANTITY_DISTRIBUTION][
          OfferKeys.QUANTITY_DISTRIBUTION_HELD
        ] = Math.max(
          offer[OfferKeys.DATA][OfferKeys.DATA__OFFER_QUANTITY_DISTRIBUTION][
            OfferKeys.QUANTITY_DISTRIBUTION_HELD
          ],
          0,
        );
      }

      // Updating available quantity
      offer[OfferKeys.DATA][OfferKeys.DATA__OFFER_QUANTITY_DISTRIBUTION][
        OfferKeys.QUANTITY_DISTRIBUTION_AVAILABLE
      ] = this.getOfferAvailableQuantity(offer);
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating offer quantity distribution',
        'updateOfferQuantityDistribution',
        false,
        500,
      );
    }
  }

  /**
   * [Reset the token quantity distribution of an offer]
   */
  resetOfferQuantityDistribution(offer: Offer) {
    try {
      // Reset purchased quantity to zero
      offer[OfferKeys.DATA][OfferKeys.DATA__OFFER_QUANTITY_DISTRIBUTION][
        OfferKeys.QUANTITY_DISTRIBUTION_PURCHASED
      ] = 0;

      // Updating available quantity
      offer[OfferKeys.DATA][OfferKeys.DATA__OFFER_QUANTITY_DISTRIBUTION][
        OfferKeys.QUANTITY_DISTRIBUTION_AVAILABLE
      ] = this.getOfferAvailableQuantity(offer);
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'resetting offer quantity distribution',
        'resetOfferQuantityDistribution',
        false,
        500,
      );
    }
  }

  /**
   * [Get the initial quantity distribution object]
   */
  getInitQuantityDistribution(offerQuantity: number): QuantityDistribution {
    try {
      return {
        // Initialize the quantity distribution by setting all counters as zero except for available quantity
        [OfferKeys.QUANTITY_DISTRIBUTION_AVAILABLE]: offerQuantity,
        [OfferKeys.QUANTITY_DISTRIBUTION_PURCHASED]: 0,
        [OfferKeys.QUANTITY_DISTRIBUTION_HELD]: 0,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'getting initial quantity distribution',
        'getInitQuantityDistribution',
        false,
        500,
      );
    }
  }

  /**
   * [Get the outstanding (available + held) token quantity of an offer]
   */
  getOfferOutstandingQuantity(offer: Offer): number {
    try {
      return Math.max(
        offer[OfferKeys.QUANTITY] -
          offer[OfferKeys.DATA][OfferKeys.DATA__OFFER_QUANTITY_DISTRIBUTION][
            OfferKeys.QUANTITY_DISTRIBUTION_PURCHASED
          ],
        0,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'getting offer outstanding quantity',
        'getOfferOutstandingQuantity',
        false,
        500,
      );
    }
  }

  /**
   * [Get the in-held token quantity of an offer]
   */
  getOfferHeldQuantity(offer: Offer): number {
    try {
      return offer[OfferKeys.DATA][OfferKeys.DATA__OFFER_QUANTITY_DISTRIBUTION][
        OfferKeys.QUANTITY_DISTRIBUTION_HELD
      ];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'getting offer held quantity',
        'getOfferHeldQuantity',
        false,
        500,
      );
    }
  }

  /**
   * [Get the currently available token quantity of an offer]
   */
  getOfferAvailableQuantity(offer: Offer): number {
    try {
      return Math.max(
        offer[OfferKeys.QUANTITY] -
          offer[OfferKeys.DATA][OfferKeys.DATA__OFFER_QUANTITY_DISTRIBUTION][
            OfferKeys.QUANTITY_DISTRIBUTION_PURCHASED
          ] -
          offer[OfferKeys.DATA][OfferKeys.DATA__OFFER_QUANTITY_DISTRIBUTION][
            OfferKeys.QUANTITY_DISTRIBUTION_HELD
          ],
        0,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'getting offer available quantity',
        'getOfferAvailableQuantity',
        false,
        500,
      );
    }
  }

  /**
   * [Get the total token quantity currently held by negotiation orders with the user as seller]
   */
  async getTotalNegotiationHeldQuantity(
    offer: Offer,
    user: User,
    getFromAllOffers: boolean,
  ): Promise<number> {
    try {
      let minQuantity = 0;

      const negotiatingOrderList: Array<Order> =
        await this.orderService.listAllOrders(
          offer[OfferKeys.TENANT_ID],
          user,
          offer[OfferKeys.ENTITY_ID],
          WorkflowName.OFFER,
          undefined, //tokenIds
          ['negotiating'],
          undefined, //functionNames
          [user[UserKeys.USER_ID]], //userIds
          undefined, //dates
          undefined, // sorts
        );

      const heldOrderList = negotiatingOrderList.filter((order: Order) => {
        return (
          (getFromAllOffers ||
            order[OrderKeys.OFFER_ID] === offer[OfferKeys.ID]) &&
          order[OrderKeys.DATA]?.[OrderKeys.DATA__NEGOTIATION_HOLD_GRANTED]
        );
      });

      const heldQuantity = heldOrderList.reduce(
        (total, order) => total + order[OrderKeys.QUANTITY],
        0,
      );

      minQuantity = heldQuantity;
      return minQuantity;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'getting total negotiation held quantity',
        'getTotalNegotiationHeldQuantity',
        false,
        500,
      );
    }
  }
}
