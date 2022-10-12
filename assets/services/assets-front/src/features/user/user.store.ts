import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TenantType } from 'constants/tenantKeys';
import { RootState } from 'features/app.store';
import {
  IConfig,
  IWorkflowInstance,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import { ITenant } from 'types/Tenant';
import { IAppModalData } from 'uiComponents/AppModal/AppModal';
import { IUser } from 'User';
import {
  clearStorage,
  getFromStorage,
  setOnStorage,
} from './utils/persistentStorage';

export interface UserSlice {
  user?: IUser;
  superadmin?: IUser;
  tenantType?: TenantType;
  userSpace?: IWorkflowInstance;
  config?: IConfig;
  modal?: IAppModalData;
  clientMetadata?: ITenant['clientMetadata'];
  applicationMenuMinified: boolean;
  paginatedTable?: any;
  cachedView?: {
    [key: string]: number;
  };
}

const initialState: UserSlice = {
  user: getFromStorage('user', true) as IUser,
  superadmin: getFromStorage('superadmin', true) as IUser,
  tenantType: getFromStorage('tenantType', false) as TenantType,
  userSpace: getFromStorage('space', true) as IWorkflowInstance,
  config: getFromStorage('config', true) as IConfig,
  clientMetadata: getFromStorage(
    'clientMetadata',
    true,
  ) as ITenant['clientMetadata'],
  applicationMenuMinified: getFromStorage(
    'applicationMenuMinified',
    true,
  ) as boolean,
  paginatedTable: getFromStorage('paginatedTable', true),
  cachedView: getFromStorage('cachedView', true),
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    reset: (state) => {
      clearStorage([
        'tenantType',
        'user',
        'userSpace',
        'config',
        'paginatedTable',
      ]);
      state.user = initialState.user;
      state.tenantType = initialState.tenantType;
      state.config = initialState.config;
      state.superadmin = initialState.superadmin;
      state.paginatedTable = initialState.paginatedTable;
      state.userSpace = initialState.userSpace;
    },
    setUser: (state, action: PayloadAction<IUser>) => {
      setOnStorage('user', action.payload);
      state.user = action.payload;
    },
    setSuperadmin: (state, action: PayloadAction<IUser>) => {
      setOnStorage('superadmin', action.payload);
      state.superadmin = action.payload;
    },
    setTenantType: (state, action: PayloadAction<TenantType>) => {
      setOnStorage('tenantType', action.payload);
      state.tenantType = action.payload;
    },
    setUserSpace: (state, action: PayloadAction<IWorkflowInstance>) => {
      setOnStorage('userSpace', action.payload);
      state.userSpace = action.payload;
    },
    setConfig: (state, action: PayloadAction<IConfig>) => {
      setOnStorage('config', action.payload);
      state.config = action.payload;
    },
    setAppModal: (state, action: PayloadAction<IAppModalData>) => {
      state.modal = action.payload;
    },
    setClientMetadata: (
      state,
      action: PayloadAction<ITenant['clientMetadata']>,
    ) => {
      setOnStorage('clientMetadata', action.payload);
      state.clientMetadata = action.payload;
    },
    setApplicationMenuMinified: (state, action: PayloadAction<boolean>) => {
      setOnStorage('applicationMenuMinified', action.payload);
      state.applicationMenuMinified = action.payload;
    },
    setPaginatedTable: (state, action: PayloadAction<any>) => {
      setOnStorage('paginatedTable', action.payload);
      state.paginatedTable = action.payload;
    },
    setCachedView: (state, action: PayloadAction<any>) => {
      setOnStorage('cachedView', action.payload);
      state.cachedView = action.payload;
    },
  },
});

export const userSelector = (state: RootState) => state.user.user;
export const tenantTypeSelector = (state: RootState) => state.user.tenantType;
export const userSpaceSelector = (state: RootState) => state.user.userSpace;
export const configSelector = (state: RootState) => state.user.config;
export const appModalDataSelector = (state: RootState) => state.user.modal;
export const clientMetadataSelector = (state: RootState) =>
  state.user.clientMetadata;
export const applicationMenuMinifiedSelector = (state: RootState) =>
  state.user.applicationMenuMinified;
export const paginatedTableKeySelector = (key: string) => (state: RootState) =>
  state.user.paginatedTable?.[key];
export const cachedViewSelector = (state: RootState) => state.user.cachedView;

export default userSlice.reducer;
export const {
  setUser,
  setTenantType,
  setUserSpace,
  setSuperadmin,
  setConfig,
  setAppModal,
  setClientMetadata,
  setApplicationMenuMinified,
  setPaginatedTable,
  setCachedView,
  reset,
} = userSlice.actions;
