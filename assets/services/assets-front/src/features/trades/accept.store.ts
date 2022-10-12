import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import {
  DvpType,
  IToken,
  IWorkflowInstance,
  OrderType,
  SmartContract,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import { Hold, HoldStatusCode } from 'types/Trades.d';
import { Network } from 'types/Network';
import { IUser } from '../../User';
import { AppThunk, RootState } from '../app.store';
import { generateCode, isAddress } from 'utils/commonUtils';
import { DataCall } from 'utils/dataLayer';
import {
  API_CREATE_SECONDARY_FORCE_PAID_ORDER,
  API_FETCH_HOLD_DATA,
} from 'constants/apiRoutes';
import { appMessageData } from '../../uiComponents/AppMessages/AppMessage';
import { CommonTexts } from '../../texts/commun/commonTexts';
import { mdiAlertOctagon } from '@mdi/js';
import { colors } from '../../constants/styles';
import { EventEmitter, Events } from 'features/events/EventEmitter';

export interface AcceptSecondaryMarketTradeSlice {
  activeWizardStep: number;
  isFetchingHold: boolean;
  isAcceptingTrade: boolean;
  errors: Record<FormFields, boolean>;
  overview: MarketTradePaymentOverview;
  deliveryHold?: Hold;
  deliveryHoldDetails: HoldVerificationDetails;
  paymentHoldDetails: MarketTradeHolderInfo;
  orderAcceptanceReceipt?: IWorkflowInstance;
}

interface MarketTradePaymentOverview {
  isEditing: boolean;
  expiresIn: number; // seconds
}

interface HoldVerificationDetails {
  network?: Network;
  holdId: string;
  asset: string; // address
}

interface MarketTradeHolderInfo {
  isEditing: boolean;
  network?: Network;
  asset?: IToken;
  assetQuery: string;
  assetHasClasses: boolean;
  assetClass?: string;
  quantity?: number;
  senderQuery: string;
  sender?: IUser;
  recipientQuery: string;
  recipient?: IUser;
}

export enum FormFields {
  VERIFY_NETWORK,
  VERIFY_HOLD_ID,
  VERIFY_ASSET,
  EXPIRES_IN,
  DELIVERY_ASSET,
  DELIVERY_ASSET_CLASS,
  DELIVERY_SENDER,
  DELIVERY_QUANTITY,
  DELIVERY_RECIPIENT,
  PAYMENT_NETWORK,
  PAYMENT_ASSET,
  PAYMENT_ASSET_CLASS,
  PAYMENT_SENDER,
  PAYMENT_QUANTITY,
  PAYMENT_RECIPIENT,
}

const initialState: AcceptSecondaryMarketTradeSlice = {
  activeWizardStep: 0,
  isFetchingHold: false,
  isAcceptingTrade: false,
  errors: {
    [FormFields.VERIFY_NETWORK]: false,
    [FormFields.VERIFY_HOLD_ID]: false,
    [FormFields.VERIFY_ASSET]: false,
    [FormFields.EXPIRES_IN]: false,
    [FormFields.DELIVERY_ASSET]: false,
    [FormFields.DELIVERY_ASSET_CLASS]: false,
    [FormFields.DELIVERY_SENDER]: false,
    [FormFields.DELIVERY_QUANTITY]: false,
    [FormFields.DELIVERY_RECIPIENT]: false,
    [FormFields.PAYMENT_NETWORK]: false,
    [FormFields.PAYMENT_ASSET]: false,
    [FormFields.PAYMENT_ASSET_CLASS]: false,
    [FormFields.PAYMENT_SENDER]: false,
    [FormFields.PAYMENT_QUANTITY]: false,
    [FormFields.PAYMENT_RECIPIENT]: false,
  },
  overview: {
    isEditing: true,
    expiresIn: 0,
  },
  deliveryHoldDetails: {
    asset: '',
    holdId: '',
  },
  paymentHoldDetails: {
    isEditing: true,
    assetQuery: '',
    assetHasClasses: false,
    senderQuery: '',
    recipientQuery: '',
  },
};

const acceptSecondaryMarketTradeSlice = createSlice({
  name: 'acceptSecondaryMarketTrade',
  initialState,
  reducers: {
    reset: (state) => {
      state.activeWizardStep = initialState.activeWizardStep;
      state.isFetchingHold = initialState.isFetchingHold;
      state.errors = initialState.errors;
      state.overview = initialState.overview;
      state.paymentHoldDetails = initialState.paymentHoldDetails;
      state.deliveryHold = initialState.deliveryHold;
      state.orderAcceptanceReceipt = initialState.orderAcceptanceReceipt;
    },
    setFieldErrors: (
      state,
      action: PayloadAction<{ field: FormFields; error: boolean }[]>,
    ) => {
      for (const error of action.payload)
        state.errors[error.field] = error.error;
    },
    setExpiresIn: (state, action: PayloadAction<number>) => {
      state.overview.expiresIn = action.payload;
    },
    setOverviewIsEditing: (state, action: PayloadAction<boolean>) => {
      state.overview.isEditing = action.payload;
    },
    setActiveStep: (state, action: PayloadAction<number>) => {
      state.activeWizardStep = action.payload;
    },
    setDeliveryHoldNetwork: (state, action: PayloadAction<Network>) => {
      state.deliveryHoldDetails.network = action.payload;
    },
    setDeliveryHoldId: (state, action: PayloadAction<string>) => {
      state.deliveryHoldDetails.holdId = action.payload;
    },
    setDeliveryHoldAsset: (state, action: PayloadAction<string>) => {
      state.deliveryHoldDetails.asset = action.payload;
    },
    setIsFetchingHold: (state, action: PayloadAction<boolean>) => {
      state.isFetchingHold = action.payload;
    },
    setDeliveryHold: (state, action: PayloadAction<Hold>) => {
      state.deliveryHold = action.payload;
    },
    setPaymentHoldIsEditing: (state, action: PayloadAction<boolean>) => {
      state.paymentHoldDetails.isEditing = action.payload;
    },
    setPaymentHoldNetwork: (state, action: PayloadAction<Network>) => {
      state.paymentHoldDetails.network = action.payload;
    },
    setPaymentHoldAssetQuery: (state, action: PayloadAction<string>) => {
      state.paymentHoldDetails.assetQuery = action.payload;
    },
    setPaymentHoldAssetHasClasses: (state, action: PayloadAction<boolean>) => {
      state.paymentHoldDetails.assetHasClasses = action.payload;
    },
    setPaymentHoldAssetClass: (state, action: PayloadAction<string>) => {
      state.paymentHoldDetails.assetClass = action.payload;
    },
    setPaymentHoldAsset: (state, action: PayloadAction<IToken>) => {
      state.paymentHoldDetails.asset = action.payload;
    },
    setPaymentHoldSenderQuery: (state, action: PayloadAction<string>) => {
      state.paymentHoldDetails.senderQuery = action.payload;
    },
    setPaymentHoldSender: (state, action: PayloadAction<IUser>) => {
      state.paymentHoldDetails.sender = action.payload;
    },
    setPaymentHoldRecipientQuery: (state, action: PayloadAction<string>) => {
      state.paymentHoldDetails.recipientQuery = action.payload;
    },
    setPaymentHoldRecipient: (state, action: PayloadAction<IUser>) => {
      state.paymentHoldDetails.recipient = action.payload;
    },
    setPaymentHoldQuantity: (state, action: PayloadAction<number>) => {
      state.paymentHoldDetails.quantity = action.payload;
    },
    setIsAcceptingTrade: (state, action: PayloadAction<boolean>) => {
      state.isAcceptingTrade = action.payload;
    },
    setOrderAcceptanceReceipt: (
      state,
      action: PayloadAction<IWorkflowInstance>,
    ) => {
      state.orderAcceptanceReceipt = action.payload;
    },
  },
});

/**
 * Selectors
 * use these to get data from store (eg. useSelector(<selector>))
 */
export const errorsSelector = (state: RootState): Record<string, boolean> =>
  state.acceptSecondaryMarketTrade.errors;

export const activeWizardStepSelector = (state: RootState): number =>
  state.acceptSecondaryMarketTrade.activeWizardStep;

export const isAcceptingTradeSelector = (state: RootState): boolean =>
  state.acceptSecondaryMarketTrade.isAcceptingTrade;

export const isFetchingHoldSelector = (state: RootState): boolean =>
  state.acceptSecondaryMarketTrade.isFetchingHold;

export const holdVerificationDetailsSelector = (
  state: RootState,
): HoldVerificationDetails =>
  state.acceptSecondaryMarketTrade.deliveryHoldDetails;

export const deliveryHoldSelector = (state: RootState): Hold | undefined =>
  state.acceptSecondaryMarketTrade.deliveryHold;

export const isHoldVerificationDetailsValidSelector = (
  state: RootState,
): boolean =>
  !state.acceptSecondaryMarketTrade.errors[FormFields.VERIFY_HOLD_ID] &&
  !state.acceptSecondaryMarketTrade.errors[FormFields.VERIFY_ASSET] &&
  !state.acceptSecondaryMarketTrade.errors[FormFields.VERIFY_NETWORK] &&
  state.acceptSecondaryMarketTrade.deliveryHoldDetails.holdId !== '' &&
  state.acceptSecondaryMarketTrade.deliveryHoldDetails.asset !== '' &&
  state.acceptSecondaryMarketTrade.deliveryHoldDetails.network !== undefined;

export const overviewSectionDataSelector = (
  state: RootState,
): MarketTradePaymentOverview => state.acceptSecondaryMarketTrade.overview;

export const paymentSectionDataSelector = (
  state: RootState,
): MarketTradeHolderInfo => state.acceptSecondaryMarketTrade.paymentHoldDetails;

export const orderAcceptanceReceiptSelector = (
  state: RootState,
): IWorkflowInstance | undefined =>
  state.acceptSecondaryMarketTrade.orderAcceptanceReceipt;

/**
 * Reducers
 */
export const validateHoldVerificationNetwork =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.VERIFY_NETWORK,
          error:
            !getState().acceptSecondaryMarketTrade.deliveryHoldDetails.network
              ?.key,
        },
      ]),
    );
  };

export const validateHoldVerificationId =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.VERIFY_HOLD_ID,
          error:
            getState().acceptSecondaryMarketTrade.deliveryHoldDetails.holdId ===
            '',
        },
      ]),
    );
  };

export const validateHoldVerificationAsset =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.VERIFY_ASSET,
          error: !isAddress(
            getState().acceptSecondaryMarketTrade.deliveryHoldDetails.asset,
          ),
        },
      ]),
    );
  };

export const validateOverviewExpiresIn =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    const paymentExpirationDate =
      new Date().getTime() / 1000 +
      getState().acceptSecondaryMarketTrade.overview.expiresIn;
    const timeToPaymentExpiration =
      getState().acceptSecondaryMarketTrade.overview.expiresIn;
    const tradeExpiration = parseInt(
      getState().acceptSecondaryMarketTrade.deliveryHold?.expiration || '0',
    );

    dispatch(
      setFieldErrors([
        {
          field: FormFields.EXPIRES_IN,
          error:
            !timeToPaymentExpiration ||
            timeToPaymentExpiration < 86400 ||
            paymentExpirationDate >= tradeExpiration,
        },
      ]),
    );
  };

export const validateOverviewAndSave =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    const paymentExpiration =
      new Date().getTime() / 1000 +
      getState().acceptSecondaryMarketTrade.overview.expiresIn;
    const timeToPaymentExpiration =
      getState().acceptSecondaryMarketTrade.overview.expiresIn;
    const tradeExpiration = parseInt(
      getState().acceptSecondaryMarketTrade.deliveryHold?.expiration || '0',
    );
    dispatch(
      setFieldErrors([
        {
          field: FormFields.EXPIRES_IN,
          error:
            !timeToPaymentExpiration ||
            timeToPaymentExpiration < 86400 ||
            paymentExpiration >= tradeExpiration,
        },
      ]),
    );
    const errors = getState().acceptSecondaryMarketTrade.errors;
    if (!errors[FormFields.EXPIRES_IN]) dispatch(setOverviewIsEditing(false));
  };

export const validatePaymentHoldNetwork =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.PAYMENT_NETWORK,
          error:
            !getState().acceptSecondaryMarketTrade.paymentHoldDetails.network
              ?.key,
        },
      ]),
    );
  };

export const validatePaymentHoldAsset =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.PAYMENT_ASSET,
          error:
            !getState().acceptSecondaryMarketTrade.paymentHoldDetails.asset,
        },
      ]),
    );
  };

export const validatePaymentHoldAssetClass =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.PAYMENT_ASSET,
          error:
            getState().acceptSecondaryMarketTrade.paymentHoldDetails
              .assetHasClasses &&
            !getState().acceptSecondaryMarketTrade.paymentHoldDetails
              .assetClass,
        },
      ]),
    );
  };

export const validatePaymentHoldSender =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.PAYMENT_SENDER,
          error:
            !getState().acceptSecondaryMarketTrade.paymentHoldDetails.sender,
        },
      ]),
    );
  };

export const validatePaymentHoldQuantity =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.PAYMENT_QUANTITY,
          error:
            !getState().acceptSecondaryMarketTrade.paymentHoldDetails.quantity,
        },
      ]),
    );
  };

export const validatePaymentHoldRecipient =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.PAYMENT_RECIPIENT,
          error:
            !getState().acceptSecondaryMarketTrade.paymentHoldDetails.recipient,
        },
      ]),
    );
  };

export const validatePaymentHoldAndSave =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    const paymentHoldData =
      getState().acceptSecondaryMarketTrade.paymentHoldDetails;
    dispatch(
      setFieldErrors([
        {
          field: FormFields.PAYMENT_NETWORK,
          error: !paymentHoldData.network?.key,
        },
        {
          field: FormFields.PAYMENT_ASSET,
          error: !paymentHoldData.asset,
        },
        {
          field: FormFields.PAYMENT_ASSET_CLASS,
          error: paymentHoldData.assetHasClasses && !paymentHoldData.assetClass,
        },
        {
          field: FormFields.PAYMENT_SENDER,
          error: !paymentHoldData.sender,
        },
        {
          field: FormFields.PAYMENT_QUANTITY,
          error: !paymentHoldData.quantity,
        },
        {
          field: FormFields.PAYMENT_RECIPIENT,
          error: !paymentHoldData.recipient,
        },
      ]),
    );

    const errors = getState().acceptSecondaryMarketTrade.errors;
    if (
      !errors[FormFields.PAYMENT_NETWORK] &&
      !errors[FormFields.PAYMENT_ASSET] &&
      !errors[FormFields.PAYMENT_ASSET_CLASS] &&
      !errors[FormFields.PAYMENT_SENDER] &&
      !errors[FormFields.PAYMENT_QUANTITY] &&
      !errors[FormFields.PAYMENT_RECIPIENT]
    )
      dispatch(setPaymentHoldIsEditing(false));
  };

export const updateHoldVerificationNetwork =
  (network: Network): AppThunk =>
  (dispatch: Dispatch) => {
    dispatch(setDeliveryHoldNetwork(network));
  };

export const updateHoldVerificationId =
  (holdId: string): AppThunk =>
  (dispatch: Dispatch) => {
    dispatch(setDeliveryHoldId(holdId));
  };

export const updateHoldVerificationAsset =
  (address: string): AppThunk =>
  (dispatch: Dispatch) => {
    dispatch(setDeliveryHoldAsset(address));
  };

export const updatePaymentHoldAsset =
  (asset: IToken): AppThunk =>
  (dispatch: Dispatch) => {
    dispatch(setPaymentHoldAsset(asset));
    dispatch(setPaymentHoldAssetQuery(asset.name));
    if (asset?.assetClasses && asset?.assetClasses?.length > 0) {
      dispatch(setPaymentHoldAssetHasClasses(true));
    }
    if (asset?.assetClasses && asset?.assetClasses?.length === 1) {
      dispatch(setPaymentHoldAssetClass(asset?.assetClasses[0]));
    }
  };

export const updatePaymentHoldSender =
  (user: IUser): AppThunk =>
  (dispatch: Dispatch) => {
    const fullNameWithClient = `${user.firstName} ${user.lastName}${
      user.data?.clientName ? ` (${user.data?.clientName})` : ''
    }`;
    console.log('Payment Hold updated with clientName:', user.data?.clientName);
    dispatch(setPaymentHoldSender(user));
    dispatch(setPaymentHoldSenderQuery(fullNameWithClient));
  };

export const updatePaymentHoldRecipient =
  (user: IUser): AppThunk =>
  (dispatch: Dispatch) => {
    const fullNameWithClient = `${user.firstName} ${user.lastName}${
      user.data?.clientName ? ` (${user.data?.clientName})` : ''
    }`;
    console.log('Payment Hold updated with clientName:', user.data?.clientName);
    dispatch(setPaymentHoldRecipient(user));
    dispatch(setPaymentHoldRecipientQuery(fullNameWithClient));
  };

export const verifyTrade =
  (): AppThunk => async (dispatch: Dispatch, getState) => {
    dispatch(setIsFetchingHold(true));
    try {
      const deliveryHoldParams =
        getState().acceptSecondaryMarketTrade.deliveryHoldDetails;
      const { hold }: { hold: Hold } = await DataCall({
        method: API_FETCH_HOLD_DATA.method,
        path: API_FETCH_HOLD_DATA.path(),
        urlParams: {
          holdId: deliveryHoldParams.holdId,
          tokenAddress: deliveryHoldParams.asset,
          networkKey: deliveryHoldParams.network?.key,
        },
      });

      // we check if the hold is already executed
      if (hold.statusReadable !== HoldStatusCode.ORDERED) {
        EventEmitter.dispatch(
          Events.EVENT_APP_MESSAGE,
          appMessageData({
            message: CommonTexts.error.defaultMessage,
            secondaryMessage: 'The delivery hold is not in the ORDERED state.',
            icon: mdiAlertOctagon,
            color: colors.error,
            isDark: true,
          }),
        );
        dispatch(setIsFetchingHold(false));
        return;
      }

      // we check if the hold is expired
      if (new Date(parseInt(hold.expiration) * 1000) < new Date()) {
        EventEmitter.dispatch(
          Events.EVENT_APP_MESSAGE,
          appMessageData({
            message: CommonTexts.error.defaultMessage,
            secondaryMessage: 'The delivery hold is already expired.',
            icon: mdiAlertOctagon,
            color: colors.error,
            isDark: true,
          }),
        );

        dispatch(setIsFetchingHold(false));
        return;
      }

      dispatch(
        setDeliveryHold({
          id: deliveryHoldParams.holdId,
          ...hold,
        }),
      );

      dispatch(setPaymentHoldNetwork(deliveryHoldParams.network as Network));

      dispatch(setIsFetchingHold(false));
      dispatch(setActiveStep(1));
    } catch (e) {
      dispatch(setIsFetchingHold(false));
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: CommonTexts.error.defaultMessage,
          secondaryMessage:
            'There was an unexpected error while fetching hold data.',
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    }
  };

export const acceptTrade =
  (): AppThunk => async (dispatch: Dispatch, getState) => {
    try {
      dispatch(setIsAcceptingTrade(true));

      const { paymentHoldDetails, deliveryHold, deliveryHoldDetails } =
        getState().acceptSecondaryMarketTrade;
      const { order }: { order: IWorkflowInstance } = await DataCall({
        method: API_CREATE_SECONDARY_FORCE_PAID_ORDER.method,
        path: API_CREATE_SECONDARY_FORCE_PAID_ORDER.path(),
        body: {
          idempotencyKey: generateCode(),
          senderId: paymentHoldDetails.sender?.id,
          recipientId: paymentHoldDetails.recipient?.id,
          paymentTokenId: paymentHoldDetails.asset?.id,
          paymentAssetClass: paymentHoldDetails.assetClass,
          paymentAmount: paymentHoldDetails.quantity,
          orderType: OrderType.QUANTITY,
          dvpType: DvpType.ATOMIC,
          deliveryHoldId: deliveryHold?.id,
          deliveryTokenNetworkKey: deliveryHoldDetails.network?.key,
          deliveryTokenAddress: deliveryHoldDetails.asset,
          deliveryTokenStandard: SmartContract.ERC1400_HOLDABLE_CERTIFICATE,
        },
      });

      dispatch(setOrderAcceptanceReceipt(order));
      dispatch(setIsAcceptingTrade(false));
      dispatch(setActiveStep(2));
    } catch (error) {
      dispatch(setIsAcceptingTrade(false));
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
    const { orderAcceptanceReceipt, paymentHoldDetails } =
      getState().acceptSecondaryMarketTrade;
    const value: string = [
      `Payment Hold ID: ${orderAcceptanceReceipt?.data?.dvp?.payment?.holdId}`,
      `Payment Token Address: ${paymentHoldDetails.asset?.defaultDeployment}`,
      `Payment Amount: ${paymentHoldDetails.quantity}`,
      `Payment Sender Wallet: ${paymentHoldDetails.sender?.defaultWallet}`,
      `Payment Recipient Walelt: ${paymentHoldDetails.recipient?.defaultWallet}`,
    ].join(`\n`);
    await navigator.clipboard?.writeText(value);
  };

export const {
  reset,
  setActiveStep,
  setIsFetchingHold,
  setDeliveryHoldAsset,
  setDeliveryHoldId,
  setDeliveryHoldNetwork,
  setFieldErrors,
  setDeliveryHold,
  setExpiresIn,
  setOverviewIsEditing,
  setPaymentHoldIsEditing,
  setPaymentHoldNetwork,
  setPaymentHoldAssetQuery,
  setPaymentHoldAssetHasClasses,
  setPaymentHoldAssetClass,
  setPaymentHoldAsset,
  setPaymentHoldRecipient,
  setPaymentHoldSender,
  setPaymentHoldSenderQuery,
  setPaymentHoldRecipientQuery,
  setPaymentHoldQuantity,
  setIsAcceptingTrade,
  setOrderAcceptanceReceipt,
} = acceptSecondaryMarketTradeSlice.actions;
export default acceptSecondaryMarketTradeSlice.reducer;
