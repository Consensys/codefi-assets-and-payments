import { configureStore, Reducer, ThunkAction, Action } from '@reduxjs/toolkit';
import userSliceReducer, { UserSlice } from './user/user.store';
import createSecondaryMarketTradeSliceReducer, {
  CreateSecondaryMarketTradeSlice,
} from './trades/create.store';
import acceptSecondaryMarketTradeSliceReducer, {
  AcceptSecondaryMarketTradeSlice,
} from './trades/accept.store';
import settleSecondaryMarketTradeSliceReducer, {
  SettleSecondaryMarketTradeSlice,
} from './trades/settle.store';

export interface IAppStore {
  user: Reducer<UserSlice>;
  createSecondaryMarketTrade: Reducer<CreateSecondaryMarketTradeSlice>;
  acceptSecondaryMarketTrade: Reducer<AcceptSecondaryMarketTradeSlice>;
  settleSecondaryMarketTrade: Reducer<SettleSecondaryMarketTradeSlice>;
}

const rootAppReducer: IAppStore = {
  user: userSliceReducer,
  createSecondaryMarketTrade: createSecondaryMarketTradeSliceReducer,
  acceptSecondaryMarketTrade: acceptSecondaryMarketTradeSliceReducer,
  settleSecondaryMarketTrade: settleSecondaryMarketTradeSliceReducer,
};

const store = configureStore({
  reducer: rootAppReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
export default store;
