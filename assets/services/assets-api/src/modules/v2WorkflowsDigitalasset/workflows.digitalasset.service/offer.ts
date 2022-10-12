/**
 * Asset / Trade Offer
 *
 * -- Off-chain offer-workflow --
 *
 * The fund subscription workflow allows an investor to purchase new tokens:
 *  1) Creating a offer off-chain
 *  2) Accepting/rejecting offer off-chain
 *
 *
 */

import {
  TokenIdentifierEnum,
  WorkflowTemplateEnum,
  WorkflowInstanceEnum,
} from 'src/old/constants/enum';

import { keys as TokenKeys, Token } from 'src/types/token';
import ErrorService from 'src/utils/errorService';
import { keys as UserKeys, User, UserType } from 'src/types/user';

import WorkflowMiddleWare from 'src/old/services/middlewares/workflowMiddleware';

import { LinkService } from 'src/modules/v2Link/link.service';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { TransactionHelperService } from 'src/modules/v2Transaction/transaction.service';
import { Injectable } from '@nestjs/common';
import {
  CreateBindingOfferOutput,
  CreateOfferOutput,
  CreateTradeOrderOutput,
  PurchaseOfferOutput,
  UpdateOfferOutput,
} from '../workflows.digitalasset.dto';

import {
  FunctionName,
  SmartContract,
  TokenCategory,
} from 'src/types/smartContract';
import {
  BuyOrderType,
  DvpType,
  keys as OfferKeys,
  keys as OrderKeys,
  ListingStatus,
  OfferStatus,
  OrderSide,
  OrderType,
  WorkflowInstance,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import { ClassData } from 'src/types/asset';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';

import { EntityType } from 'src/types/entity';

import { TokenTxHelperService } from 'src/modules/v2Transaction/transaction.service/token';
import { checkIntegerFormat } from 'src/utils/number';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { TokenState } from 'src/types/states';
import { keys as WalletKeys, Wallet } from 'src/types/wallet';
import {
  keys as WorkflowTemplateKeys,
  WorkflowName,
} from 'src/types/workflow/workflowTemplate';
import { AssetDataService } from 'src/modules/v2AssetData/asset.data.service';
import { Offer } from 'src/types/workflow/workflowInstances/offer';
import { Config } from 'src/types/config';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { BalanceService } from 'src/modules/v2Balance/balance.service';
import { WorkFlowsSecondaryTradeService } from './secondaryTrade';
import { setToLowerCase } from 'src/utils/case';
import { Order } from 'src/types/workflow/workflowInstances/order';
import { ApiMailingCallService } from 'src/modules/v2ApiCall/api.call.service/mailing';
import { OfferService } from 'src/modules/v2Offer/offer.service';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

const TYPE_WORKFLOW_NAME = WorkflowName.OFFER;

@Injectable()
export class WorkFlowsOfferService {
  constructor(
    private readonly transactionHelperService: TransactionHelperService,
    private readonly tokenTxHelperService: TokenTxHelperService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly workflowTemplateService: ApiWorkflowWorkflowTemplateService,
    // private readonly apiMailingCallService: ApiMailingCallService, // Leaving it hear as it will be needed later
    private readonly linkService: LinkService,
    private readonly walletService: WalletService,
    private readonly assetDataService: AssetDataService,
    private readonly balanceService: BalanceService,
    private readonly configService: ConfigService,
    private readonly workFlowsSecondaryTradeService: WorkFlowsSecondaryTradeService,
    private readonly apiMailingCallService: ApiMailingCallService,
    private readonly offerService: OfferService,
  ) {}

  /**
   * [Create offer]
   *
   * This function can only be called by an investor.
   * It starts a new offer-workflow .
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: NOT_STARTED
   *  - Destination state: SUBMITTED
   */
  async createOffer(
    tenantId: string,
    callerId: string,
    idempotencyKey: string,
    user: User,
    tokenId: string,
    assetClassKey: string,
    offerQuantity: number,
    offerPrice: number,
    offerStatus: OfferStatus,
    enableAtPriceOrder: boolean,
    enableBidPriceOrder: boolean,
    enableNegotiation: boolean,
    automateRetirement: boolean,
    dvpType: DvpType,
    paymentTokenAddress: string,
    paymentTokenStandard: SmartContract,
    data: any,
    sendNotification: boolean,
    authToken: string,
  ): Promise<CreateOfferOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName = FunctionName.CREATE_OFFER;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // ------------- Format all input data (beginning) -------------
      const _offerStatus: OfferStatus =
        this.offerService.retrieveOfferStatus(offerStatus);

      // Preliminary step: Fetch all required data in databases
      const [issuer, token, offerWithSameKey, config]: [
        User,
        Token,
        Offer,
        Config,
      ] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tokenId,
          EntityType.TOKEN,
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tokenId,
          true,
          undefined,
          undefined,
          true,
        ),
        this.workflowService.retrieveWorkflowInstanceByIdempotencyKey(
          tenantId,
          WorkflowType.OFFER,
          idempotencyKey,
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      if (!config.data.enableOfferCreation) {
        ErrorService.throwError(
          `Tenant config of ${tenantId} is not allowed to create offers`,
        );
      }

      // Idempotency
      if (offerWithSameKey) {
        // Offer was already created (idempotency)
        return {
          offer: offerWithSameKey,
          created: false,
          message: 'Offer creation was already done (idempotencyKey)',
        };
      }

      const assetClassData: ClassData =
        this.assetDataService.retrieveAssetClassData(token, assetClassKey);

      // ==> Step1: Perform several checks before sending the transaction
      await this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      checkIntegerFormat(offerQuantity, offerPrice);

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // createOffer
        issuer,
        token,
        config,
        user, // user invoking function
        undefined, // token recipient
        tokenState, // originTokenState
        assetClassKey, // originTokenClass
        undefined, // destinationTokenState
        undefined, // destinationTokenClass
      );

      const userWallet: Wallet = this.walletService.extractWalletFromUser(
        user,
        user[UserKeys.DEFAULT_WALLET],
      );

      // Fetch all offers already created by this user
      let offersList: Array<Offer> =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityIdAndUserId,
          undefined, // instanceIdOrInstanceIds
          undefined, // idempotencyKey
          user[UserKeys.USER_ID], // userIdOrUserIds
          tokenId,
          undefined, //objectId
          undefined, // entityType
          WorkflowType.OFFER,
          undefined, // otherWorkflowType
          false,
        );

      // Get only offer with OfferStatus.OPEN && corresponding assetClassKey
      offersList = offersList.filter(
        (offerObj) =>
          offerObj.data.offerStatus === OfferStatus.OPEN &&
          offerObj.assetClassKey === assetClassKey,
      );

      // Get total outstanding (available + held) quantity on all OPEN offers so far
      let totalOutstandingQuantityOnOffers = 0;
      if (offersList && offersList.length > 0) {
        totalOutstandingQuantityOnOffers = offersList.reduce(
          (total, currentOffer) =>
            total + this.offerService.getOfferOutstandingQuantity(currentOffer),
          0,
        );
      }

      await this.balanceService.checkTokenOwnership(
        tenantId,
        tokenCategory,
        callerId,
        userWallet,
        token,
        tokenState,
        assetClassKey,
        undefined, // tokenIdentifier (only for non-fungible tokens)
        offerQuantity + totalOutstandingQuantityOnOffers,
        true,
      );

      // ------------- Format all input data (end) -------------
      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // createOffer
      );

      // Fetch workflow template Id for the relevant workflow name from Workflow-API
      const offerWorkflowTemplateId: number = (
        await this.workflowTemplateService.retrieveWorkflowTemplate(
          tenantId,
          WorkflowTemplateEnum.name,
          undefined,
          TYPE_WORKFLOW_NAME,
        )
      )[WorkflowTemplateKeys.ID];

      const dataForWorkflowInstance = {
        ...data,
        [OfferKeys.DATA__OFFER_STATUS]: _offerStatus,
        [OfferKeys.DATA__OFFER_ENABLE_AT_PRICE_ORDER]: enableAtPriceOrder,
        [OfferKeys.DATA__OFFER_ENABLE_BID_PRICE_ORDER]: enableBidPriceOrder,
        [OfferKeys.DATA__OFFER_ENABLE_NEGOTIATION]: enableNegotiation,
        [OfferKeys.DATA__AUTOMATE_RETIREMENT]: automateRetirement,
        [OfferKeys.DATA__OFFER_QUANTITY_DISTRIBUTION]:
          this.offerService.getInitQuantityDistribution(offerQuantity),
        [OfferKeys.DATA__DVP]: {
          [OfferKeys.DATA__DVP__PAYMENT]: {},
        },
      };

      dataForWorkflowInstance[OfferKeys.DATA__DVP][OfferKeys.DATA__DVP__TYPE] =
        dvpType ? dvpType : DvpType.NON_ATOMIC;

      dataForWorkflowInstance[OfferKeys.DATA__DVP][
        OfferKeys.DATA__DVP__PAYMENT
      ][OfferKeys.DATA__DVP__PAYMENT__TOKEN_ADDRESS] = paymentTokenAddress;

      dataForWorkflowInstance[OfferKeys.DATA__DVP][
        OfferKeys.DATA__DVP__PAYMENT
      ][OfferKeys.DATA__DVP__PAYMENT__TOKEN_STANDARD] = paymentTokenStandard;

      // Create offer in Workflow-API
      const offer: Offer = await this.workflowService.createWorkflowInstance(
        tenantId,
        idempotencyKey,
        WorkflowType.OFFER,
        functionName,
        typeFunctionUser,
        user[UserKeys.USER_ID],
        token[TokenKeys.TOKEN_ID],
        EntityType.TOKEN,
        undefined, // objectId
        undefined, // recipientId
        undefined, // brokerId
        undefined, // agentId
        offerWorkflowTemplateId,
        offerQuantity, // offer quantity
        offerPrice, // offer price
        undefined, // documentId
        userWallet[WalletKeys.WALLET_ADDRESS],
        assetClassKey, // assetClass
        new Date(),
        nextState, // FundSubscriptionWorkflow.SUBSCRIBED,
        undefined, //offerId
        undefined, //orderSide
        dataForWorkflowInstance, //data
      );

      // Send email notification to seller when listing is in pending/approved by marketplace
      if (
        sendNotification &&
        data[OfferKeys.DATA__LISTING_STATUS] !== ListingStatus.REJECTED
      ) {
        await this.apiMailingCallService.notifyInvestorListingStatus(
          tenantId,
          user,
          offer,
          token,
          data[OfferKeys.DATA__LISTING_STATUS],
          authToken,
        );
      }

      return {
        offer,
        created: true,
        message: `Offer ${
          offer[OfferKeys.ID]
        } of ${offerQuantity} tokens created successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating offer',
        'createOffer',
        false,
        500,
      );
    }
  }

  /**
   * [Update offer]
   *
   * This function can only be called by an investor.
   * It starts Updates an existing offer.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: SUBMITTED
   *  - Destination state: SUBMITTED
   */
  async updateOffer(
    tenantId: string,
    callerId: string,
    user: User,
    offerId: number,
    newOfferQuantity: number,
    newOfferPrice: number,
    newOfferStatus: OfferStatus,
    newEnableAtPriceOrder: boolean,
    newEnableBidPriceOrder: boolean,
    newEnableNegotiation: boolean,
    newAutomateRetirement: boolean,
    newData: any,
    sendNotification: boolean,
    authToken: string,
  ): Promise<UpdateOfferOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName = FunctionName.UPDATE_OFFER;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // ------------- Format all input data (beginning) -------------
      const _newOfferStatus: OfferStatus = newOfferStatus
        ? this.offerService.retrieveOfferStatus(newOfferStatus)
        : undefined;

      // Get WorkflowInstance to be updated
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

      // Only offer owner is allowed to update the offer
      if (user[UserKeys.USER_ID] !== offer[OfferKeys.USER_ID]) {
        ErrorService.throwError(
          `provided userId (${
            user[UserKeys.USER_ID]
          }) is not the owner of the offer (${offer[OfferKeys.USER_ID]})`,
        );
      }

      const token = await this.apiMetadataCallService.retrieveTokenInDB(
        tenantId,
        TokenIdentifierEnum.tokenId,
        offer[OfferKeys.ENTITY_ID],
        true,
        undefined,
        undefined,
        true,
      );

      // Fetch all Offers on this entity by this investor (who can update the listing)
      let offersList: Array<WorkflowInstance> =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityIdAndUserId,
          undefined, // instanceIdOrInstanceIds
          undefined, // idempotencyKey
          offer[OfferKeys.USER_ID], // userIdOrUserIds
          offer[OfferKeys.ENTITY_ID],
          undefined, //objectId
          undefined, // entityType
          WorkflowType.OFFER,
          undefined, // otherWorkflowType
          false,
        );

      if (
        !offersList.find(
          (fetchedOffer) => fetchedOffer[OfferKeys.ID] === offerId,
        )
      ) {
        ErrorService.throwError(
          `shall never happen: offer with id ${offerId} was not found in user's list of offers`,
        );
      }

      const _newData: any = {
        ...offer[OfferKeys.DATA],
        ...(newData || {}),
      };

      if (_newOfferStatus !== undefined) {
        _newData[OfferKeys.DATA__OFFER_STATUS] = _newOfferStatus;
      }
      if (newEnableAtPriceOrder !== undefined) {
        _newData[OfferKeys.DATA__OFFER_ENABLE_AT_PRICE_ORDER] =
          newEnableAtPriceOrder;
      }
      if (newEnableBidPriceOrder !== undefined) {
        _newData[OfferKeys.DATA__OFFER_ENABLE_BID_PRICE_ORDER] =
          newEnableBidPriceOrder;
      }
      if (newEnableNegotiation !== undefined) {
        _newData[OfferKeys.DATA__OFFER_ENABLE_NEGOTIATION] =
          newEnableNegotiation;
      }
      if (newAutomateRetirement !== undefined) {
        _newData[OfferKeys.DATA__AUTOMATE_RETIREMENT] = newAutomateRetirement;
      }

      const newOffer: Offer = {
        ...offer,
        [OfferKeys.DATA]: _newData,
      };

      if (newOfferPrice !== undefined) {
        newOffer[OfferKeys.PRICE] = newOfferPrice;
      }

      if (newOfferQuantity !== undefined) {
        const heldQuantity = this.offerService.getOfferHeldQuantity(offer);
        if (newOfferQuantity < heldQuantity) {
          ErrorService.throwError(
            `invalid new offer quantity: quantity(${newOfferQuantity}) cannot be less than the held quantity (${heldQuantity})`,
          );
        }

        // Exclude the target offer itself and offers with not OfferStats.OPEN  && corresponding assetClassKey from the offer list
        offersList = offersList.filter(
          (offerObj) =>
            offerObj[OfferKeys.ID] !== offerId &&
            offerObj.data.offerStatus === OfferStatus.OPEN &&
            offerObj.assetClassKey === offer.assetClassKey,
        );

        // Get total outstanding (available + held) quantity on all OPEN offers so far
        let totalOutstandingQuantityOnOffers = 0;
        if (offersList && offersList.length > 0) {
          totalOutstandingQuantityOnOffers = offersList.reduce(
            (total, currentOffer) =>
              total +
              this.offerService.getOfferOutstandingQuantity(currentOffer),
            0,
          );
        }

        const userWallet: Wallet = this.walletService.extractWalletFromUser(
          user,
          user[UserKeys.DEFAULT_WALLET],
        );

        await this.balanceService.checkTokenOwnership(
          tenantId,
          tokenCategory,
          callerId,
          userWallet,
          token,
          tokenState,
          offer[OfferKeys.ASSET_CLASS],
          undefined, // tokenIdentifier (only for non-fungible tokens)
          newOfferQuantity + totalOutstandingQuantityOnOffers,
          true,
        );

        newOffer[OfferKeys.QUANTITY] = newOfferQuantity;
        this.offerService.resetOfferQuantityDistribution(newOffer);
      }

      // ------------- Format all input data (end) -------------

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        offerId, // workflow instance ID
        typeFunctionUser,
        functionName, // updateOffer
      );

      // Update workflow instance in Workflow-API
      const updatedOffer: Offer =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          offerId,
          functionName,
          typeFunctionUser,
          nextState, // SUBMITTED
          newOffer,
        );

      // Send email notification to seller when listing gets approved/rejected by marketplace
      if (
        sendNotification &&
        newData[OfferKeys.DATA__LISTING_STATUS] !== ListingStatus.PENDING
      ) {
        await this.apiMailingCallService.notifyInvestorListingStatus(
          tenantId,
          user,
          updatedOffer,
          token,
          newData[OfferKeys.DATA__LISTING_STATUS],
          authToken,
        );
      }

      return {
        offer: updatedOffer,
        message: `Offer with id ${offerId} updated successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating offer',
        'updateOffer',
        false,
        500,
      );
    }
  }

  /**
   * [Purchase offer]
   *
   * This function can only be called by an investor.
   * It updates an existing offer and also creates a secondary trade order in ACCEPTED state
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: SUBMITTED
   *  - Offer destination state: SUBMITTED
   *  - New order created with state: ACCEPTED
   */
  async purchaseOffer(
    tenantId: string,
    user: User,
    callerId: string,
    idempotencyKey: string,
    offerId: number,
    purchaseQuantity: number,
    sendNotification: boolean,
    offerMetadata: Record<string, unknown>,
    authToken: string,
  ): Promise<PurchaseOfferOutput> {
    const functionName: FunctionName = FunctionName.PURCHASE_OFFER;
    const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];

    this.isofferIdValid(offerId);

    try {
      // Fetch offer in database
      const offer: Offer = await this.workflowService.retrieveWorkflowInstances(
        tenantId,
        WorkflowInstanceEnum.id,
        offerId,
        undefined, // idempotencyKey
        undefined,
        undefined,
        undefined,
        undefined, // entityType
        undefined, // workflowType (if querying by id, workflow-api doesn't use this param even if passed, expecting WorkflowType.OFFER)
        undefined, // otherWorkflowType
        true,
      );

      // Check the validity of the offer for purchase
      this.offerService.checkOfferValidity(
        offer,
        purchaseQuantity,
        BuyOrderType.PURCHASE,
      );

      // Fetch all other necessary information which inturn checks various things including data valitidity
      const [seller, token]: [User, Token] = await Promise.all([
        this.apiEntityCallService.fetchEntity(
          tenantId,
          offer[OfferKeys.USER_ID],
          true,
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          offer[OfferKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
      ]);

      const issuerId = token[TokenKeys.ISSUER_ID];
      const [sellerBrokerId] = await Promise.all([
        this.linkService.retrieveBrokerIdIfExisting(
          tenantId,
          seller[UserKeys.USER_ID],
          issuerId,
        ),
      ]);

      const [sellerBroker] = await Promise.all([
        sellerBrokerId
          ? this.apiEntityCallService.fetchEntity(
              tenantId,
              sellerBrokerId,
              true,
            )
          : undefined,
      ]);

      // The buyer needs to be linked to the asset class of the token in order
      // to be allowed to purchase the token
      const userWallet: Wallet = this.walletService.extractWalletFromUser(
        user,
        user[UserKeys.DEFAULT_WALLET],
      );

      await this.linkService.createUserEntityLinkIfRequired(
        tenantId,
        typeFunctionUser,
        undefined, // idFunctionUser
        user,
        functionName,
        EntityType.TOKEN,
        undefined, // entityProject
        undefined, // entityIssuer
        token, // entityToken
        setToLowerCase(offer[OfferKeys.ASSET_CLASS]),
        userWallet,
      );

      // Checks are done, time to action the request (updates/creates)
      const orderCreationResponse: CreateTradeOrderOutput =
        await this.workFlowsSecondaryTradeService.createTradeOrder(
          tenantId,
          idempotencyKey,
          callerId,
          user, // User who created base purchase offer
          offer[OfferKeys.USER_ID], // Token senderId (SellerId), Mandatory for Buy Orders
          user[UserKeys.USER_ID], // recipientId
          user[UserKeys.EMAIL], // recipientEmail,
          offer[OfferKeys.ENTITY_ID], //tokenId
          setToLowerCase(offer[OfferKeys.ASSET_CLASS]),
          OrderType.QUANTITY,
          purchaseQuantity, //createOrderBody.quantity,
          purchaseQuantity * offer[OfferKeys.PRICE], //Price: incase of orders, it is total cost of order instead unit price
          offer[OfferKeys.DATA]?.[OfferKeys.DATA__DVP]?.[
            OfferKeys.DATA__DVP__TYPE
          ], //createOrderBody.dvpType,
          offer[OfferKeys.DATA]?.[OfferKeys.DATA__DVP]?.[
            OfferKeys.DATA__DVP__PAYMENT
          ]?.[OfferKeys.DATA__DVP__PAYMENT__TOKEN_ID], //payment Token Id
          offer[OfferKeys.DATA]?.[OfferKeys.DATA__DVP]?.[
            OfferKeys.DATA__DVP__PAYMENT
          ]?.[OfferKeys.DATA__DVP__PAYMENT__TOKEN_ADDRESS], //payment Token Address
          offer[OfferKeys.DATA]?.[OfferKeys.DATA__DVP]?.[
            OfferKeys.DATA__DVP__PAYMENT
          ]?.[OfferKeys.DATA__DVP__PAYMENT__TOKEN_STANDARD], //payment Token Standard
          offer[OfferKeys.DATA]?.[OfferKeys.DATA__DVP]?.[
            OfferKeys.DATA__DVP__PAYMENT
          ]?.[OfferKeys.DATA__DVP__PAYMENT__TOKEN_ASSET_CLASS], //payment Token Asset Class
          offerId,
          functionName, // callingFunctionName
          OrderSide.BUY, // Order created from buyer side for offer/purchase''
          {
            [OfferKeys.DATA__BUY_ORDER_TYPE]: BuyOrderType.PURCHASE,
            [OfferKeys.DATA__AUTOMATE_RETIREMENT]:
              offer[OfferKeys.DATA]?.[OfferKeys.DATA__AUTOMATE_RETIREMENT],
            ...offerMetadata,
          }, //createOrderBody.data,
          false, // sendNotification (For offer purchase, we will send emails below)
          authToken,
        );
      let createdOrder: Order = orderCreationResponse.order;

      const nextState = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        offer[OfferKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // purchaseOffer
      );

      // Update the offer quantity distibution for purchased credits
      this.offerService.updateOfferQuantityDistribution(
        offer,
        purchaseQuantity,
        0, //heldQuantity
        false, //initiateHold
      );

      const offerOutstandingQuantity =
        this.offerService.getOfferOutstandingQuantity(offer);

      // Update workflow instance in Workflow-API
      const updatedOffer = await this.workflowService.updateWorkflowInstance(
        tenantId,
        offer[OfferKeys.ID], // workflow instance ID,
        offerOutstandingQuantity <= 0 ? functionName : undefined, // functionName,
        offerOutstandingQuantity <= 0 ? typeFunctionUser : undefined, // typeFunctionUser,
        offerOutstandingQuantity <= 0 ? nextState : undefined, // nextState = PURCHASED (if outstanding quantity is zero, otherwise it should remain SUBMITTED)
        offer,
      );

      // As order created  in `accepted` status for purchaseNow, hold the tokens, if autoHold is enabled for the token
      if (token[TokenKeys.DATA][TokenKeys.DATA__AUTOMATE_HOLD_CREATION]) {
        const holdTokenOutput =
          await this.workFlowsSecondaryTradeService.holdTradeOrderDelivery(
            tenantId,
            callerId,
            sellerBroker,
            String(createdOrder[OrderKeys.ID]),
            undefined, //timeToExpiration, defaults to 1 week
            undefined, //data
            sendNotification,
            authToken,
          );

        // send updated order in response
        createdOrder = holdTokenOutput.order;
      }

      if (sendNotification) {
        // send email notification to seller
        this.apiMailingCallService.notifySenderTradeOrderCreated(
          tenantId,
          seller,
          user,
          createdOrder,
          token,
          offer[OfferKeys.ASSET_CLASS], // Eg: tonne for Project Carbon
          'Purchase Order', //tradeTypeSubjLabel
          'an order', //tradeTypeMsgLabel
          authToken,
        );

        // send email notification to brokerOfSeller, if brokerOfSeller exists and autoHold is false
        if (
          !token[TokenKeys.DATA][TokenKeys.DATA__AUTOMATE_HOLD_CREATION] &&
          sellerBroker
        ) {
          this.apiMailingCallService.notifyIssuerTradeOrderAccepted(
            tenantId,
            sellerBroker,
            seller,
            user,
            createdOrder,
            token,
            authToken,
          );
        }
      }

      return {
        message: `Offer with id ${
          offer[OfferKeys.ID]
        } successfully purchased, resulting in the creation of order with id ${
          createdOrder[OfferKeys.ID]
        }`,
        offer: updatedOffer,
        order: createdOrder,
        created: true,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'purchasing offer',
        functionName,
        false,
        500,
      );
    }
  }

  /**
   * [Bind offer]
   *
   * This function can only be called by an investor.
   * It creates a secondary trade order in Submitted state from Buy side
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - New Buy order created with state: SUBMITTED
   */
  async bindOffer(
    tenantId: string,
    user: User,
    callerId: string,
    idempotencyKey: string,
    offerId: number,
    bindOfferQuantity: number,
    bindOfferPrice: number,
    bindOfferExpiryDate: Date,
    sendNotification: boolean,
    bindOfferMetadata: Record<string, unknown>,
    authToken: string,
  ): Promise<CreateBindingOfferOutput> {
    const functionName: FunctionName = FunctionName.BIND_OFFER;

    this.isofferIdValid(offerId);

    try {
      // Fetch offer in database
      const offer: Offer = await this.workflowService.retrieveWorkflowInstances(
        tenantId,
        WorkflowInstanceEnum.id,
        offerId,
        undefined, // idempotencyKey
        undefined,
        undefined,
        undefined,
        undefined, // entityType
        undefined, // workflowType (if querying by id, workflow-api doesn't use this param even if passed, expecting WorkflowType.OFFER)
        undefined, // otherWorkflowType
        true,
      );

      // Check the validity of the offer for bid
      this.offerService.checkOfferValidity(
        offer,
        bindOfferQuantity,
        BuyOrderType.BID,
      );

      const [sender, token]: [User, Token] = await Promise.all([
        this.apiEntityCallService.fetchEntity(
          tenantId,
          offer[OfferKeys.USER_ID],
          true,
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          offer[OfferKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
      ]);

      // The buyer needs to be linked to the asset class of the token in order
      // to be allowed to purchase the token
      const userWallet: Wallet = this.walletService.extractWalletFromUser(
        user,
        user[UserKeys.DEFAULT_WALLET],
      );

      await this.linkService.createUserEntityLinkIfRequired(
        tenantId,
        user[UserKeys.USER_TYPE],
        undefined, // idFunctionUser
        user,
        functionName,
        EntityType.TOKEN,
        undefined, // entityProject
        undefined, // entityIssuer
        token, // entityToken
        setToLowerCase(offer[OfferKeys.ASSET_CLASS]),
        userWallet,
      );

      const orderCreationResponse: CreateTradeOrderOutput =
        await this.workFlowsSecondaryTradeService.createTradeOrder(
          tenantId,
          idempotencyKey,
          callerId,
          user, // Investor selecting Binding offer(Bid Now)
          offer[OfferKeys.USER_ID], // token sender (SellerId)=Creator of the purchase Offer, in this case, Mandatory for Buy Orders
          user[UserKeys.USER_ID], // recipientId
          user[UserKeys.EMAIL], // recipientEmail,
          offer[OfferKeys.ENTITY_ID], //tokenId
          setToLowerCase(offer[OfferKeys.ASSET_CLASS]),
          OrderType.QUANTITY,
          bindOfferQuantity, //createOrderBody.quantity,
          bindOfferQuantity * bindOfferPrice, //Price: incase of orders, it is total cost of order instead unit price
          offer[OfferKeys.DATA]?.[OfferKeys.DATA__DVP]?.[
            OfferKeys.DATA__DVP__TYPE
          ], //createOrderBody.dvpType,
          offer[OfferKeys.DATA]?.[OfferKeys.DATA__DVP]?.[
            OfferKeys.DATA__DVP__PAYMENT
          ]?.[OfferKeys.DATA__DVP__PAYMENT__TOKEN_ID], //payment Token Id
          offer[OfferKeys.DATA]?.[OfferKeys.DATA__DVP]?.[
            OfferKeys.DATA__DVP__PAYMENT
          ]?.[OfferKeys.DATA__DVP__PAYMENT__TOKEN_ADDRESS], //payment Token Address
          offer[OfferKeys.DATA]?.[OfferKeys.DATA__DVP]?.[
            OfferKeys.DATA__DVP__PAYMENT
          ]?.[OfferKeys.DATA__DVP__PAYMENT__TOKEN_STANDARD], //payment Token Standard
          offer[OfferKeys.DATA]?.[OfferKeys.DATA__DVP]?.[
            OfferKeys.DATA__DVP__PAYMENT
          ]?.[OfferKeys.DATA__DVP__PAYMENT__TOKEN_ASSET_CLASS], //payment Token Asset Class
          offerId,
          functionName, // callingFunctionName
          OrderSide.BUY, // Order created from buyer side for bind offer
          {
            [OfferKeys.DATA__BUY_ORDER_TYPE]: BuyOrderType.BID,
            bindOfferExpiryDate,
            [OfferKeys.DATA__AUTOMATE_RETIREMENT]:
              offer[OfferKeys.DATA]?.[OfferKeys.DATA__AUTOMATE_RETIREMENT],
            ...bindOfferMetadata,
          }, //createOrderBody.data,
          false, // sendNotification (For offer purchase, we will send emails below)
          authToken,
        );

      const createdOrder: Order = orderCreationResponse.order;

      if (sendNotification) {
        // send email notification to sender/seller
        this.apiMailingCallService.notifySenderTradeOrderCreated(
          tenantId,
          sender,
          user,
          createdOrder,
          token,
          offer[OfferKeys.ASSET_CLASS],
          'Bid', //tradeTypeSubjLabel
          'a bid', //tradeTypeMsgLabel
          authToken,
        );
      }

      return {
        message: `Offer with id ${
          offer[OfferKeys.ID]
        } successfully binded, resulting in the creation of order with id ${
          createdOrder[OfferKeys.ID]
        }`,
        order: createdOrder,
        created: true,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'bind offer',
        functionName,
        false,
        500,
      );
    }
  }

  /**
   * [Negotiate for Non Bind Enquiry]
   *
   * This function can only be called by a buyer (investor).
   * It creates a secondary trade order in negotiating state from Buy side
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - New Buy order created with state: NEGOTIATING
   */
  async negotiate(
    tenantId: string,
    user: User,
    callerId: string,
    idempotencyKey: string,
    offerId: number,
    negotiationQuantity: number,
    negotiationPrice: number,
    negotiationHoldRequested: boolean,
    email: string,
    phoneNumber: string,
    enquiryNotes: string,
    negotiationMetadata: Record<string, unknown>,
    sendNotification: boolean,
    authToken: string,
  ): Promise<CreateBindingOfferOutput> {
    const functionName: FunctionName = FunctionName.NEGOTIATE;

    this.isofferIdValid(offerId);

    try {
      // Fetch offer in database
      const offer: Offer = await this.workflowService.retrieveWorkflowInstances(
        tenantId,
        WorkflowInstanceEnum.id,
        offerId,
        undefined, // idempotencyKey
        undefined,
        undefined,
        undefined,
        undefined, // entityType
        undefined, // workflowType (if querying by id, workflow-api doesn't use this param even if passed, expecting WorkflowType.OFFER)
        undefined, // otherWorkflowType
        true,
      );

      // Check the validity of the offer for enquiry
      this.offerService.checkOfferValidity(
        offer,
        negotiationQuantity,
        BuyOrderType.ENQUIRE,
      );

      const [sender, token]: [User, Token] = await Promise.all([
        this.apiEntityCallService.fetchEntity(
          tenantId,
          offer[OfferKeys.USER_ID],
          true,
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          offer[OfferKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
      ]);

      const orderDataNegotiations = negotiationPrice
        ? [
            {
              pricePerUnit: negotiationPrice,
              createdAt: new Date(),
              proposedBy: user[UserKeys.USER_ID],
              acceptedBy: [user[UserKeys.USER_ID]],
              rejectedBy: [],
            },
          ]
        : [];

      // The buyer needs to be linked to the asset class of the token in order
      // to be allowed to purchase the token
      const userWallet: Wallet = this.walletService.extractWalletFromUser(
        user,
        user[UserKeys.DEFAULT_WALLET],
      );

      await this.linkService.createUserEntityLinkIfRequired(
        tenantId,
        user[UserKeys.USER_TYPE],
        undefined, // idFunctionUser
        user,
        functionName,
        EntityType.TOKEN,
        undefined, // entityProject
        undefined, // entityIssuer
        token, // entityToken
        setToLowerCase(offer[OfferKeys.ASSET_CLASS]),
        userWallet,
      );

      const orderCreationResponse: CreateTradeOrderOutput =
        await this.workFlowsSecondaryTradeService.createTradeOrder(
          tenantId,
          idempotencyKey,
          callerId,
          user, // Investor selecting Binding offer(Bid Now)
          offer[OfferKeys.USER_ID], // token sender (SellerId)=Creator of the purchase Offer, in this case, Mandatory for Buy Orders
          user[UserKeys.USER_ID], // recipientId
          user[UserKeys.EMAIL], // recipientEmail,
          offer[OfferKeys.ENTITY_ID], //tokenId
          setToLowerCase(offer[OfferKeys.ASSET_CLASS]),
          OrderType.QUANTITY,
          negotiationQuantity, //createOrderBody.quantity,
          0, // price should always be zero initially for a negotiation enabled order
          offer[OfferKeys.DATA]?.[OfferKeys.DATA__DVP]?.[
            OfferKeys.DATA__DVP__TYPE
          ], //createOrderBody.dvpType,
          offer[OfferKeys.DATA]?.[OfferKeys.DATA__DVP]?.[
            OfferKeys.DATA__DVP__PAYMENT
          ]?.[OfferKeys.DATA__DVP__PAYMENT__TOKEN_ID], //payment Token Id
          offer[OfferKeys.DATA]?.[OrderKeys.DATA__DVP]?.[
            OfferKeys.DATA__DVP__PAYMENT
          ]?.[OfferKeys.DATA__DVP__PAYMENT__TOKEN_ADDRESS], //payment Token Address
          offer[OfferKeys.DATA]?.[OfferKeys.DATA__DVP]?.[
            OfferKeys.DATA__DVP__PAYMENT
          ]?.[OfferKeys.DATA__DVP__PAYMENT__TOKEN_STANDARD], //payment Token Standard
          offer[OfferKeys.DATA]?.[OfferKeys.DATA__DVP]?.[
            OfferKeys.DATA__DVP__PAYMENT
          ]?.[OfferKeys.DATA__DVP__PAYMENT__TOKEN_ASSET_CLASS], //payment Token Asset Class
          offerId,
          functionName, // callingFunctionName
          OrderSide.BUY, // Order created from buyer side for negotiation(nonBinding Eqnuiry)
          {
            [OfferKeys.DATA__BUY_ORDER_TYPE]: BuyOrderType.ENQUIRE,
            [OfferKeys.DATA__ENABLE_NEGOTIATION]: true,
            [OfferKeys.DATA__NEGOTIATION_HOLD_GRANTED]: false,
            [OfferKeys.DATA__NEGOTIATION_RECIPIENT_EMAIL]: email,
            [OfferKeys.DATA__NEGOTIATION_RECIPIENT_PHONE_NUMBER]: phoneNumber,
            [OfferKeys.DATA__NEGOTIATION_HOLD_REQUESTED]:
              negotiationHoldRequested,
            [OfferKeys.DATA__NEGOTIATION_ENQUIRY_NOTES]: enquiryNotes,
            [OfferKeys.DATA__NEGOTIATIONS]: orderDataNegotiations,
            [OfferKeys.DATA__AUTOMATE_RETIREMENT]:
              offer[OfferKeys.DATA]?.[OfferKeys.DATA__AUTOMATE_RETIREMENT],
            ...negotiationMetadata,
          }, //createOrderBody.data,
          false, // sendNotification
          authToken,
        );

      const createdOrder: Order = orderCreationResponse.order;

      if (sendNotification) {
        // send email notification to sender/seller
        this.apiMailingCallService.notifySenderNegotiationLaunched(
          tenantId,
          sender,
          user,
          createdOrder,
          token,
          createdOrder[OrderKeys.ASSET_CLASS],
          authToken,
        );
      }

      return {
        message: `Negotiation successfully launched for offer with id ${
          offer[OfferKeys.ID]
        }, resulting in the creation of order with id ${
          createdOrder[OfferKeys.ID]
        }`,
        order: createdOrder,
        created: true,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'negotiate',
        functionName,
        false,
        500,
      );
    }
  }

  isofferIdValid(offerId: number): void {
    if (!Number.isInteger(offerId)) {
      ErrorService.throwError(
        `workflow instanceId '${offerId}' is not a number, workflow InstanceId must be an integer number Eg: 210024`,
      );
    }
  }
}
