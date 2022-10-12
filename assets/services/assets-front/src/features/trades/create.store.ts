import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk, RootState } from '../app.store';
import { Network } from 'types/Network';
import {
  DvpType,
  IToken,
  IWorkflowInstance,
  OrderType,
  SmartContract,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import { IUser } from 'User';
import { DataCall } from 'utils/dataLayer';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { mdiAlertOctagon } from '@mdi/js';
import { CommonTexts } from 'texts/commun/commonTexts';
import { colors } from 'constants/styles';
import {
  API_CREATE_SECONDARY_FORCE_TRADE_ORDER,
  API_CREATE_SECONDARY_TRADE_DELIVERY_TOKEN_HOLD,
} from 'constants/apiRoutes';
import { generateCode, isAddress } from 'utils/commonUtils';
import { EventEmitter, Events } from 'features/events/EventEmitter';

export interface CreateSecondaryMarketTradeSlice {
  activeWizardStep: number;
  isCreatingTrade: boolean;
  errors: Record<FormFields, boolean>;
  overview: MarketTradeOverview;
  deliveryHolder: InternalMarketTradeHolderInfo;
  paymentHolder: ExternalMarketTradeHolderInfo;
  orderCreationReceipt?: IWorkflowInstance;
}

interface MarketTradeOverview {
  isEditing: boolean;
  tradeType: string; // we only have 'hold' type for now
  expiresIn: number; // seconds
  network?: Network;
}

interface MarketTradeHolderInfo {
  isEditing: boolean;
  network?: Network;
  assetHasClasses: boolean;
  assetClass?: string;
  quantity?: number;
}

interface InternalMarketTradeHolderInfo extends MarketTradeHolderInfo {
  asset?: IToken;
  assetQuery: string;
  sender?: IUser;
  recipient?: IUser;
  senderQuery: string;
  recipientQuery: string;
}

interface ExternalMarketTradeHolderInfo extends MarketTradeHolderInfo {
  asset: string;
  sender: string;
  recipient: string;
}

export enum FormFields {
  EXPIRES_IN,
  NETWORK,
  DELIVERY_ASSET,
  DELIVERY_ASSET_CLASS,
  DELIVERY_SENDER,
  DELIVERY_RECIPIENT,
  DELIVERY_QUANTITY,
  PAYMENT_ASSET,
  PAYMENT_ASSET_CLASS,
  PAYMENT_SENDER,
  PAYMENT_RECIPIENT,
  PAYMENT_QUANTITY,
}

const initialState: CreateSecondaryMarketTradeSlice = {
  activeWizardStep: 0,
  isCreatingTrade: false,
  errors: {
    [FormFields.EXPIRES_IN]: false,
    [FormFields.NETWORK]: false,
    [FormFields.DELIVERY_ASSET]: false,
    [FormFields.DELIVERY_ASSET_CLASS]: false,
    [FormFields.DELIVERY_SENDER]: false,
    [FormFields.DELIVERY_RECIPIENT]: false,
    [FormFields.DELIVERY_QUANTITY]: false,
    [FormFields.PAYMENT_ASSET]: false,
    [FormFields.PAYMENT_ASSET_CLASS]: false,
    [FormFields.PAYMENT_SENDER]: false,
    [FormFields.PAYMENT_RECIPIENT]: false,
    [FormFields.PAYMENT_QUANTITY]: false,
  },
  overview: {
    isEditing: true,
    tradeType: 'hold', // we only have 'hold' type for now
    expiresIn: 0,
  },
  deliveryHolder: {
    isEditing: true,
    assetQuery: '',
    assetHasClasses: false,
    senderQuery: '',
    recipientQuery: '',
  },
  paymentHolder: {
    isEditing: true,
    asset: '',
    assetHasClasses: false,
    sender: '',
    recipient: '',
  },
};

const createSecondaryMarketTradeSlice = createSlice({
  name: 'createSecondaryMarketTrade',
  initialState,
  reducers: {
    reset: (state) => {
      state.activeWizardStep = initialState.activeWizardStep;
      state.isCreatingTrade = initialState.isCreatingTrade;
      state.errors = initialState.errors;
      state.overview = initialState.overview;
      state.deliveryHolder = initialState.deliveryHolder;
      state.paymentHolder = initialState.paymentHolder;
    },
    resetDeliveryAndPaymentAsset: (state) => {
      state.deliveryHolder.asset = initialState.deliveryHolder.asset;
      state.deliveryHolder.assetClass = initialState.deliveryHolder.assetClass;
      state.deliveryHolder.assetHasClasses =
        initialState.deliveryHolder.assetHasClasses;
      state.paymentHolder.asset = initialState.paymentHolder.asset;
      state.paymentHolder.assetClass = initialState.paymentHolder.assetClass;
      state.paymentHolder.assetHasClasses =
        initialState.paymentHolder.assetHasClasses;
    },
    setIsCreatingTrade: (state, action: PayloadAction<boolean>) => {
      state.isCreatingTrade = action.payload;
    },
    setActiveWizardStep: (state, action: PayloadAction<number>) => {
      state.activeWizardStep = action.payload;
    },
    setFieldError: (
      state,
      action: PayloadAction<{ field: FormFields; error: boolean }>,
    ) => {
      state.errors[action.payload.field] = action.payload.error;
    },
    setFieldErrors: (
      state,
      action: PayloadAction<{ field: FormFields; error: boolean }[]>,
    ) => {
      for (const error of action.payload)
        state.errors[error.field] = error.error;
    },
    setTradeType: (state, action: PayloadAction<string>) => {
      state.overview.tradeType = action.payload;
    },
    setExpiresIn: (state, action: PayloadAction<number>) => {
      state.overview.expiresIn = action.payload;
    },
    setNetwork: (state, action: PayloadAction<Network>) => {
      state.overview.network = action.payload;
    },
    setOverviewIsEditing: (state, action: PayloadAction<boolean>) => {
      state.overview.isEditing = action.payload;
    },
    setDeliveryHolderIsEditing: (state, action: PayloadAction<boolean>) => {
      state.deliveryHolder.isEditing = action.payload;
    },
    setDeliveryHolderSenderQuery: (state, action: PayloadAction<string>) => {
      state.deliveryHolder.senderQuery = action.payload;
    },
    setDeliveryHolderSender: (state, action: PayloadAction<IUser>) => {
      state.deliveryHolder.sender = action.payload;
    },
    setDeliveryHolderRecipientQuery: (state, action: PayloadAction<string>) => {
      state.deliveryHolder.recipientQuery = action.payload;
    },
    setDeliveryHolderRecipient: (state, action: PayloadAction<IUser>) => {
      state.deliveryHolder.recipient = action.payload;
    },
    setDeliveryHolderAsset: (state, action: PayloadAction<IToken>) => {
      state.deliveryHolder.asset = action.payload;
    },
    setDeliveryHolderAssetQuery: (state, action: PayloadAction<string>) => {
      state.deliveryHolder.assetQuery = action.payload;
    },
    resetDeliveryHolderAsset: (state) => {
      delete state.deliveryHolder.asset;
    },
    setDeliveryHolderAssetHasClasses: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.deliveryHolder.assetHasClasses = action.payload;
    },
    setDeliveryHolderAssetClass: (state, action: PayloadAction<string>) => {
      state.deliveryHolder.assetClass = action.payload;
    },
    setDeliveryHolderNetwork: (state, action: PayloadAction<Network>) => {
      state.deliveryHolder.network = action.payload;
    },
    setDeliveryHolderQuantity: (state, action: PayloadAction<number>) => {
      state.deliveryHolder.quantity = action.payload;
    },
    setPaymentHolderIsEditing: (state, action: PayloadAction<boolean>) => {
      state.paymentHolder.isEditing = action.payload;
    },
    setPaymentHolderAsset: (state, action: PayloadAction<string>) => {
      state.paymentHolder.asset = action.payload;
    },
    resetPaymentHolderAsset: (state) => {
      state.paymentHolder.asset = '';
    },
    setPaymentHolderAssetHasClasses: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.paymentHolder.assetHasClasses = action.payload;
    },
    setPaymentHolderAssetClass: (state, action: PayloadAction<string>) => {
      state.paymentHolder.assetClass = action.payload;
    },
    setPaymentHolderNetwork: (state, action: PayloadAction<Network>) => {
      state.paymentHolder.network = action.payload;
    },
    setPaymentHolderQuantity: (state, action: PayloadAction<number>) => {
      state.paymentHolder.quantity = action.payload;
    },
    setPaymentHolderSender: (state, action: PayloadAction<string>) => {
      state.paymentHolder.sender = action.payload;
    },
    setPaymentHolderRecipient: (state, action: PayloadAction<string>) => {
      state.paymentHolder.recipient = action.payload;
    },
    setOrderCreationReceipt: (
      state,
      action: PayloadAction<IWorkflowInstance>,
    ) => {
      state.orderCreationReceipt = action.payload;
    },
  },
});

/**
 * Selectors
 * use these to get data from store (eg. useSelector(<selector>))
 */
export const errorsSelector = (state: RootState): Record<string, boolean> =>
  state.createSecondaryMarketTrade.errors;

export const isCreatingTradeSelector = (state: RootState): boolean =>
  state.createSecondaryMarketTrade.isCreatingTrade;

export const activeWizardStepSelector = (state: RootState): number =>
  state.createSecondaryMarketTrade.activeWizardStep;

export const overviewSectionDataSelector = (
  state: RootState,
): MarketTradeOverview => state.createSecondaryMarketTrade.overview;

export const deliveryHolderSectionDataSelector = (
  state: RootState,
): InternalMarketTradeHolderInfo =>
  state.createSecondaryMarketTrade.deliveryHolder;

export const paymentHolderSectionDataSelector = (
  state: RootState,
): ExternalMarketTradeHolderInfo =>
  state.createSecondaryMarketTrade.paymentHolder;

export const tradeOrderReceiptSelector = (
  state: RootState,
): IWorkflowInstance | undefined =>
  state.createSecondaryMarketTrade.orderCreationReceipt;

/**
 * Reducers
 */
export const validateOverviewAndSave =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.EXPIRES_IN,
          error:
            getState().createSecondaryMarketTrade.overview.expiresIn < 86400,
        },
        {
          field: FormFields.NETWORK,
          error: !getState().createSecondaryMarketTrade.overview.network?.key,
        },
      ]),
    );

    const errors = getState().createSecondaryMarketTrade.errors;
    if (!errors[FormFields.EXPIRES_IN] && !errors[FormFields.NETWORK])
      dispatch(setOverviewIsEditing(false));
  };

/**
 * Fields validations
 */

export const validateOverviewExpiresIn =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.EXPIRES_IN,
          error:
            getState().createSecondaryMarketTrade.overview.expiresIn < 86400,
        },
      ]),
    );
  };

export const validateOverviewNetwork =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.NETWORK,
          error: !getState().createSecondaryMarketTrade.overview.network?.key,
        },
      ]),
    );
  };

export const validateDeliveryHolderAsset =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.DELIVERY_ASSET,
          error: !getState().createSecondaryMarketTrade.deliveryHolder.asset,
        },
      ]),
    );
  };

export const validateDeliveryHolderAssetClass =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.DELIVERY_ASSET,
          error:
            getState().createSecondaryMarketTrade.deliveryHolder
              .assetHasClasses &&
            !getState().createSecondaryMarketTrade.deliveryHolder.assetClass,
        },
      ]),
    );
  };

export const validateDeliveryHolderSender =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.DELIVERY_SENDER,
          error: !getState().createSecondaryMarketTrade.deliveryHolder.sender,
        },
      ]),
    );
  };

export const validateDeliveryHolderRecipient =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.DELIVERY_RECIPIENT,
          error:
            !getState().createSecondaryMarketTrade.deliveryHolder.recipient,
        },
      ]),
    );
  };

export const validateDeliveryHolderQuantity =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.DELIVERY_QUANTITY,
          error: !getState().createSecondaryMarketTrade.deliveryHolder.quantity,
        },
      ]),
    );
  };

export const validatePaymentHolderAsset =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.PAYMENT_ASSET,
          error: !isAddress(
            getState().createSecondaryMarketTrade.paymentHolder.asset || '',
          ),
        },
      ]),
    );
  };

export const validatePaymentHolderAssetClass =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.PAYMENT_ASSET,
          error:
            getState().createSecondaryMarketTrade.paymentHolder
              .assetHasClasses &&
            !getState().createSecondaryMarketTrade.paymentHolder.assetClass,
        },
      ]),
    );
  };

export const validatePaymentHolderQuantity =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.PAYMENT_QUANTITY,
          error: !getState().createSecondaryMarketTrade.paymentHolder.quantity,
        },
      ]),
    );
  };

export const validatePaymentHolderSender =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.PAYMENT_SENDER,
          error:
            !getState().createSecondaryMarketTrade.paymentHolder.sender ||
            !isAddress(
              getState().createSecondaryMarketTrade.paymentHolder.sender,
            ),
        },
      ]),
    );
  };

export const validatePaymentHolderRecipient =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.PAYMENT_RECIPIENT,
          error:
            !getState().createSecondaryMarketTrade.paymentHolder.recipient ||
            !isAddress(
              getState().createSecondaryMarketTrade.paymentHolder.recipient,
            ),
        },
      ]),
    );
  };

/**
 * This action validates Delivery Holder section
 * and sets isEditing to false if no errors are found
 */
export const validateDeliveryHolderAndSave =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    const deliveryHolderData =
      getState().createSecondaryMarketTrade.deliveryHolder;
    dispatch(
      setFieldErrors([
        {
          field: FormFields.DELIVERY_ASSET,
          error: !deliveryHolderData.asset,
        },
        {
          field: FormFields.DELIVERY_ASSET_CLASS,
          error:
            deliveryHolderData.assetHasClasses &&
            !deliveryHolderData.assetClass,
        },
        {
          field: FormFields.DELIVERY_SENDER,
          error: !deliveryHolderData.sender,
        },
        {
          field: FormFields.DELIVERY_QUANTITY,
          error: !deliveryHolderData.quantity,
        },
        {
          field: FormFields.DELIVERY_RECIPIENT,
          error: !deliveryHolderData.recipient,
        },
      ]),
    );

    const errors = getState().createSecondaryMarketTrade.errors;
    if (
      !errors[FormFields.DELIVERY_ASSET] &&
      !errors[FormFields.DELIVERY_ASSET_CLASS] &&
      !errors[FormFields.DELIVERY_SENDER] &&
      !errors[FormFields.DELIVERY_QUANTITY] &&
      !errors[FormFields.DELIVERY_RECIPIENT]
    )
      dispatch(setDeliveryHolderIsEditing(false));
  };

/**
 * This action validates Payment Holder section
 * and sets isEditing to false if no errors are found
 */
export const validatePaymentHolderAndSave =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    const paymentHolderData =
      getState().createSecondaryMarketTrade.paymentHolder;
    dispatch(
      setFieldErrors([
        {
          field: FormFields.PAYMENT_ASSET,
          error: !paymentHolderData.asset,
        },
        {
          field: FormFields.PAYMENT_ASSET_CLASS,
          error:
            paymentHolderData.assetHasClasses && !paymentHolderData.assetClass,
        },
        {
          field: FormFields.PAYMENT_SENDER,
          error:
            !paymentHolderData.sender || !isAddress(paymentHolderData.sender),
        },
        {
          field: FormFields.PAYMENT_QUANTITY,
          error: paymentHolderData.quantity === 0,
        },
        {
          field: FormFields.PAYMENT_RECIPIENT,
          error:
            !paymentHolderData.recipient ||
            !isAddress(paymentHolderData.recipient),
        },
      ]),
    );

    const errors = getState().createSecondaryMarketTrade.errors;
    if (
      !errors[FormFields.PAYMENT_ASSET] &&
      !errors[FormFields.PAYMENT_ASSET_CLASS] &&
      !errors[FormFields.PAYMENT_SENDER] &&
      !errors[FormFields.PAYMENT_QUANTITY] &&
      !errors[FormFields.PAYMENT_RECIPIENT]
    )
      dispatch(setPaymentHolderIsEditing(false));
  };

export const selectDeliveryHolderAsset =
  (asset: IToken): AppThunk =>
  (dispatch: Dispatch) => {
    dispatch(setDeliveryHolderAsset(asset));
    dispatch(setDeliveryHolderAssetQuery(asset.name));
    if (asset?.assetClasses && asset?.assetClasses?.length > 0) {
      dispatch(setDeliveryHolderAssetHasClasses(true));
    }
    if (asset?.assetClasses && asset?.assetClasses?.length === 1) {
      dispatch(setDeliveryHolderAssetClass(asset?.assetClasses[0]));
    }
  };

export const selectPaymentHolderAsset =
  (asset: string): AppThunk =>
  (dispatch: Dispatch) => {
    dispatch(setPaymentHolderAsset(asset));
  };

export const selectDeliveryHolderSender =
  (user: IUser): AppThunk =>
  (dispatch: Dispatch) => {
    const fullNameWithClient = `${user.firstName} ${user.lastName}${
      user.data?.clientName ? ` (${user.data?.clientName})` : ''
    }`;
    dispatch(setDeliveryHolderSender(user));
    dispatch(setDeliveryHolderSenderQuery(fullNameWithClient));
  };

export const selectDeliveryHolderRecipient =
  (user: IUser): AppThunk =>
  (dispatch: Dispatch) => {
    const fullNameWithClient = `${user.firstName} ${user.lastName}${
      user.data?.clientName ? ` (${user.data?.clientName})` : ''
    }`;
    dispatch(setDeliveryHolderRecipient(user));
    dispatch(setDeliveryHolderRecipientQuery(fullNameWithClient));
  };

export const updateNetwork =
  (network: Network): AppThunk =>
  (dispatch: Dispatch) => {
    dispatch(setNetwork(network));
    dispatch(resetDeliveryAndPaymentAsset());
  };

export const createTrade =
  (): AppThunk => async (dispatch: Dispatch, getState) => {
    dispatch(setIsCreatingTrade(true));
    const {
      createSecondaryMarketTrade: { overview, deliveryHolder, paymentHolder },
    } = getState();
    try {
      const tradeCreationCall = await DataCall({
        method: API_CREATE_SECONDARY_FORCE_TRADE_ORDER.method,
        path: API_CREATE_SECONDARY_FORCE_TRADE_ORDER.path(),
        body: {
          idempotencyKey: generateCode(),
          orderType: OrderType.QUANTITY,
          dvpType: DvpType.ATOMIC,
          senderId: deliveryHolder.sender?.id, // delivery token sender
          recipientId: deliveryHolder.recipient?.id, // delivery token recipient
          tokenId: deliveryHolder.asset?.id, // delivery token
          quantity: deliveryHolder.quantity, // delivery token amount
          assetClass: deliveryHolder.assetHasClasses // delivery token class
            ? deliveryHolder.assetClass
            : '',
          paymentTokenAddess: paymentHolder.asset, // payment token
          paymentTokenStandard: SmartContract.ERC1400_HOLDABLE_CERTIFICATE, // users can't change this for now
          amount: paymentHolder.quantity, // payment token amount
          paymentAccountAddress: paymentHolder.recipient, // payment token recipient
        },
      });

      const deliveryHoldCreationCall = await DataCall({
        method: API_CREATE_SECONDARY_TRADE_DELIVERY_TOKEN_HOLD.method,
        path: API_CREATE_SECONDARY_TRADE_DELIVERY_TOKEN_HOLD.path(),
        body: {
          orderId: tradeCreationCall.order.id,
          timeToExpiration: overview.expiresIn,
        },
      });

      dispatch(setOrderCreationReceipt(deliveryHoldCreationCall.order));
      dispatch(setActiveWizardStep(1));
      dispatch(setIsCreatingTrade(false));
    } catch (error) {
      dispatch(setIsCreatingTrade(false));
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: CommonTexts.error.defaultMessage,
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    }
  };

export const copyOrderToClipboard =
  (): AppThunk => async (dispatch: Dispatch, getState) => {
    const { orderCreationReceipt, deliveryHolder, paymentHolder } =
      getState().createSecondaryMarketTrade;
    const value: string = [
      `Delivery Hold ID: ${orderCreationReceipt?.data?.dvp?.delivery?.holdId}`,
      `Delivery Token Address: ${deliveryHolder.asset?.defaultDeployment}`,
      `Delivery Sender: ${deliveryHolder.sender?.defaultWallet}`,
      `Delivery Recipient: ${deliveryHolder.recipient?.defaultWallet}`,
      `Delivery Amount: ${deliveryHolder.quantity}`,
      `Payment Token Address: ${paymentHolder.asset}`,
      `Payment Sender: ${paymentHolder.sender}`,
      `Payment Recipient: ${paymentHolder.recipient}`,
      `Payment Amount: ${paymentHolder.quantity}`,
    ].join(`\n`);
    await navigator.clipboard?.writeText(value);
  };

export const {
  reset,
  setIsCreatingTrade,
  setActiveWizardStep,
  setFieldError,
  setFieldErrors,
  setOverviewIsEditing,
  setTradeType,
  setExpiresIn,
  setNetwork,
  setDeliveryHolderIsEditing,
  setDeliveryHolderAsset,
  resetDeliveryHolderAsset,
  setDeliveryHolderAssetQuery,
  setDeliveryHolderAssetHasClasses,
  setDeliveryHolderAssetClass,
  setDeliveryHolderNetwork,
  setDeliveryHolderQuantity,
  setPaymentHolderIsEditing,
  setPaymentHolderAsset,
  resetDeliveryAndPaymentAsset,
  resetPaymentHolderAsset,
  setPaymentHolderAssetHasClasses,
  setPaymentHolderAssetClass,
  setPaymentHolderNetwork,
  setPaymentHolderQuantity,
  setOrderCreationReceipt,
  setDeliveryHolderRecipient,
  setDeliveryHolderSender,
  setDeliveryHolderSenderQuery,
  setDeliveryHolderRecipientQuery,
  setPaymentHolderRecipient,
  setPaymentHolderSender,
} = createSecondaryMarketTradeSlice.actions;
export default createSecondaryMarketTradeSlice.reducer;
