import { mdiAlertOctagon, mdiCheck } from '@mdi/js';
import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import {
  API_FETCH_HOLD_DATA,
  API_RETRIEVE_ORDER,
  API_SETTLE_SECONDARY_ATOMIC_TRADE_ORDER,
} from 'constants/apiRoutes';
import { colors } from 'constants/styles';
import { AppThunk, RootState } from 'features/app.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';
import { IWorkflowInstance } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { CommonTexts } from 'texts/commun/commonTexts';
import { tradesTexts } from 'texts/routes/issuer/trades';
import { Network } from 'types/Network';
import { Hold, HoldStatusCode } from 'types/Trades.d';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { DataCall } from 'utils/dataLayer';

export interface SettleSecondaryMarketTradeSlice {
  activeWizardStep: number;
  isFetchingOrder: boolean;
  isFetchingHold: boolean;
  isSettlingTrade: boolean;
  errors: Record<FormFields, boolean>;
  order?: IWorkflowInstance;
  paymentHoldNetwork?: Network;
  paymentHoldId: string;
  paymentHold?: Hold;
  orderSettlementReceipt?: IWorkflowInstance;
}

export enum FormFields {
  VERIFY_NETWORK,
  VERIFY_HOLD_ID,
}

const initialState: SettleSecondaryMarketTradeSlice = {
  activeWizardStep: 0,
  isFetchingOrder: false,
  isFetchingHold: false,
  isSettlingTrade: false,
  errors: {
    [FormFields.VERIFY_NETWORK]: false,
    [FormFields.VERIFY_HOLD_ID]: false,
  },
  paymentHoldId: '',
};

export const settleSecondaryMarketTradeSlice = createSlice({
  name: 'settleSecondaryMarketTrade',
  initialState,
  reducers: {
    reset: (state) => {
      state.activeWizardStep = initialState.activeWizardStep;
      state.isFetchingOrder = initialState.isFetchingOrder;
      state.isSettlingTrade = initialState.isSettlingTrade;
      state.errors = initialState.errors;
      state.order = initialState.order;
      state.paymentHold = initialState.paymentHold;
      state.orderSettlementReceipt = initialState.orderSettlementReceipt;
    },
    setActiveStep: (state, action: PayloadAction<number>) => {
      state.activeWizardStep = action.payload;
    },
    setFieldErrors: (
      state,
      action: PayloadAction<{ field: FormFields; error: boolean }[]>,
    ) => {
      for (const error of action.payload)
        state.errors[error.field] = error.error;
    },
    setOrder: (state, action: PayloadAction<IWorkflowInstance>) => {
      state.order = action.payload;
    },
    setIsFetchingHold: (state, action: PayloadAction<boolean>) => {
      state.isFetchingHold = action.payload;
    },
    setIsSettlingTrade: (state, action: PayloadAction<boolean>) => {
      state.isSettlingTrade = action.payload;
    },
    setIsFetchingOrder: (state, action: PayloadAction<boolean>) => {
      state.isFetchingOrder = action.payload;
    },
    setPaymentHoldId: (state, action: PayloadAction<string>) => {
      state.paymentHoldId = action.payload;
    },
    setPaymentHold: (state, action: PayloadAction<Hold>) => {
      state.paymentHold = action.payload;
    },
    setPaymentHoldNetwork: (state, action: PayloadAction<Network>) => {
      state.paymentHoldNetwork = action.payload;
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
  state.settleSecondaryMarketTrade.activeWizardStep;

export const isFetchingOrderSelector = (state: RootState): boolean =>
  state.settleSecondaryMarketTrade.isFetchingOrder;

export const isFetchingHoldSelector = (state: RootState): boolean =>
  state.settleSecondaryMarketTrade.isFetchingHold;

export const isSettlingTradeSelector = (state: RootState): boolean =>
  state.settleSecondaryMarketTrade.isSettlingTrade;

export const orderSelector = (
  state: RootState,
): IWorkflowInstance | undefined => state.settleSecondaryMarketTrade.order;

export const paymentHoldIdSelector = (state: RootState): string =>
  state.settleSecondaryMarketTrade.paymentHoldId;

export const paymentHoldSelector = (state: RootState): Hold | undefined =>
  state.settleSecondaryMarketTrade.paymentHold;

export const paymentHoldNetworkSelector = (
  state: RootState,
): Network | undefined => state.settleSecondaryMarketTrade.paymentHoldNetwork;

export const isHoldVerificationDetailsValidSelector = (
  state: RootState,
): boolean =>
  !state.settleSecondaryMarketTrade.errors[FormFields.VERIFY_HOLD_ID] &&
  state.settleSecondaryMarketTrade.paymentHoldNetwork !== undefined;

/**
 * Reducers
 */
export const validatePaymentHoldNetwork =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.VERIFY_NETWORK,
          error: !getState().settleSecondaryMarketTrade.paymentHoldNetwork?.key,
        },
      ]),
    );
  };

export const validatePaymentHoldId =
  (): AppThunk => (dispatch: Dispatch, getState) => {
    dispatch(
      setFieldErrors([
        {
          field: FormFields.VERIFY_HOLD_ID,
          error: getState().settleSecondaryMarketTrade.paymentHoldId === '',
        },
      ]),
    );
  };

export const fetchOrder =
  (orderId: string): AppThunk =>
  async (dispatch: Dispatch) => {
    dispatch(setIsFetchingOrder(true));
    try {
      const { order }: { order: IWorkflowInstance } = await DataCall({
        method: API_RETRIEVE_ORDER.method,
        path: API_RETRIEVE_ORDER.path(orderId),
      });
      dispatch(setOrder(order));
      dispatch(setIsFetchingOrder(false));
    } catch (error) {
      dispatch(setIsFetchingOrder(false));
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

export const verifyPayment =
  (): AppThunk => async (dispatch: Dispatch, getState) => {
    try {
      const { order, paymentHoldId, paymentHoldNetwork } =
        getState().settleSecondaryMarketTrade;
      if (!order || !paymentHoldId || !paymentHoldNetwork) {
        EventEmitter.dispatch(
          Events.EVENT_APP_MESSAGE,
          appMessageData({
            message: CommonTexts.error.defaultMessage,
            secondaryMessage: 'No order or hold id specified.',
            icon: mdiAlertOctagon,
            color: colors.error,
            isDark: true,
          }),
        );
        return;
      }

      dispatch(setIsFetchingHold(true));
      const { hold }: { hold: Hold } = await DataCall({
        method: API_FETCH_HOLD_DATA.method,
        path: API_FETCH_HOLD_DATA.path(),
        urlParams: {
          holdId: paymentHoldId,
          tokenAddress: order?.data?.dvp?.payment?.tokenAddress,
          networkKey: paymentHoldNetwork?.key,
        },
      });

      // we check if the hold is already executed
      if (hold.statusReadable !== HoldStatusCode.ORDERED) {
        EventEmitter.dispatch(
          Events.EVENT_APP_MESSAGE,
          appMessageData({
            message: CommonTexts.error.defaultMessage,
            secondaryMessage: 'The payment hold is not in the ORDERED state.',
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
            secondaryMessage: 'The payment hold is already expired.',
            icon: mdiAlertOctagon,
            color: colors.error,
            isDark: true,
          }),
        );
        dispatch(setIsFetchingHold(false));
        return;
      }

      // we check if the hold has the right amount
      if (Number(hold.valueReadable) < Number(order?.price)) {
        EventEmitter.dispatch(
          // we will use Redux also for notifications in the future
          Events.EVENT_APP_MESSAGE,
          appMessageData({
            message: CommonTexts.error.defaultMessage,
            secondaryMessage: `The payment hold has the wrong amount of tokens (${Number(
              order?.price,
            )} expected, ${Number(hold.valueReadable)} found).`,
            icon: mdiAlertOctagon,
            color: colors.error,
            isDark: true,
          }),
        );
        dispatch(setIsFetchingHold(false));
        return;
      }

      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: tradesTexts.verificationSuccessful.defaultMessage,
          secondaryMessage: tradesTexts.pleaseReviewInfo.defaultMessage,
          icon: mdiCheck,
          color: colors.success,
          isDark: true,
        }),
      );

      dispatch(setIsFetchingHold(false));
      dispatch(
        setPaymentHold({
          id: paymentHoldId,
          ...hold,
        }),
      );
    } catch (error) {
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
      dispatch(setIsFetchingHold(false));
    }
  };

export const settleTrade =
  (): AppThunk => async (dispatch: Dispatch, getState) => {
    const tradeOrder = getState().settleSecondaryMarketTrade.order;
    const paymentHold = getState().settleSecondaryMarketTrade.paymentHold;

    if (!tradeOrder || !paymentHold) {
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: CommonTexts.error.defaultMessage,
          secondaryMessage: 'No order or hold id specified.',
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
      return;
    }
    dispatch(setIsSettlingTrade(true));

    try {
      await DataCall({
        method: API_SETTLE_SECONDARY_ATOMIC_TRADE_ORDER.method,
        path: API_SETTLE_SECONDARY_ATOMIC_TRADE_ORDER.path(),
        body: {
          orderId: tradeOrder?.id,
          paymentHoldId: paymentHold?.id,
        },
      });
      dispatch(setActiveStep(1));
      dispatch(setIsSettlingTrade(false));
    } catch (error) {
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
      dispatch(setIsSettlingTrade(false));
    }
  };

export const {
  reset,
  setActiveStep,
  setFieldErrors,
  setIsFetchingHold,
  setIsFetchingOrder,
  setIsSettlingTrade,
  setOrder,
  setPaymentHoldId,
  setPaymentHold,
  setPaymentHoldNetwork,
} = settleSecondaryMarketTradeSlice.actions;
export default settleSecondaryMarketTradeSlice.reducer;
