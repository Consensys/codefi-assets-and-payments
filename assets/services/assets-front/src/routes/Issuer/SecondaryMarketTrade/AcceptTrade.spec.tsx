import store from '../../../features/app.store';
import '@testing-library/jest-dom';
import {
  FormFields,
  reset,
  setActiveStep,
  setDeliveryHold,
  setDeliveryHoldAsset,
  setPaymentHoldNetwork,
  updateHoldVerificationNetwork,
  updatePaymentHoldAsset,
  updatePaymentHoldRecipient,
  updatePaymentHoldSender,
} from '../../../features/trades/accept.store';
import {
  changeElementValue,
  clickElement,
  id,
  query,
  renderTestBed,
} from '../../../../test/testBed';
import {
  craftHoldStub,
  craftNetworkStub,
  craftTokenStub,
  craftUsersStub,
  craftWorkflowInstanceStub,
} from '../../../../test/stubFactory';
import { Network } from '../../../types/Network';
import {
  DvpType,
  IToken,
  OrderType,
  SmartContract,
} from '../AssetIssuance/templatesTypes';
import { IUser } from '../../../User';
import * as dataLayer from '../../../utils/dataLayer';
import {
  API_CREATE_SECONDARY_FORCE_PAID_ORDER,
  API_FETCH_HOLD_DATA,
} from '../../../constants/apiRoutes';
import { generateCode } from '../../../utils/commonUtils';
import { AcceptTrade } from './AcceptTrade';
import { setPaymentHolderNetwork } from '../../../features/trades/create.store';

jest.mock('../../../features/assets/assets.query', () => {
  const originalModule = jest.requireActual(
    '../../../features/assets/assets.query',
  );
  const stubFactory = jest.requireActual('../../../../test/stubFactory');
  const tokensStub = stubFactory.craftTokensStub(5);
  const tokenInvestorsStub = stubFactory.craftUsersStub(5);
  return {
    __esModule: true,
    ...originalModule,
    searchAssetsByNameOrAddressQuerySelector: jest.fn(() => tokensStub),
    searchAssetInvestorsByNameOrAddressQuerySelector: jest.fn(
      () => tokenInvestorsStub,
    ),
  };
});

jest.mock('../../../features/networks/networks.query', () => {
  const originalModule = jest.requireActual(
    '../../../features/networks/networks.query',
  );
  const stubFactory = jest.requireActual('../../../../test/stubFactory');
  const networksStub = stubFactory.craftNetworksStub(5);
  return {
    __esModule: true,
    ...originalModule,
    networksListQuery: jest.fn(() => {
      return networksStub;
    }),
  };
});

jest.mock('../../../utils/dataLayer', () => {
  const originalModule = jest.requireActual('../../../utils/dataLayer');
  return {
    __esModule: true,
    ...originalModule,
    DataCall: jest.fn(),
  };
});

jest.mock('../../../utils/commonUtils', () => {
  const originalModule = jest.requireActual('../../../utils/commonUtils');
  return {
    __esModule: true,
    ...originalModule,
    generateCode: jest.fn(() => 'idempKey'),
  };
});

const mockedDataLayer = dataLayer as jest.Mocked<typeof dataLayer>;

enum FormFieldsTestId {
  EXPIRES_IN = 'field-expiresIn',
  DELIVERY_HOLD_ID = 'field-deliveryHoldId',
  DELIVERY_HOLD_ASSET = 'field-deliveryHoldAddress',
  PAYMENT_ASSET = 'field-paymentAsset',
  PAYMENT_DELIVERY_ACCOUNT = 'field-paymentDeliveryAccount',
  PAYMENT_PAYMENT_ACCOUNT = 'field-paymentPaymentAccount',
  PAYMENT_QUANTITY = 'field-paymentQuantity',
}

enum SaveFormSectionsTestId {
  OVERVIEW = 'save-overview',
  DELIVERY = 'save-delivery',
  PAYMENT = 'save-payment-details',
  VERIFY_TRADE = 'verify-trade',
  ACCEPT_TRADE = 'accept-trade',
}

const tradeStore = () => store.getState().acceptSecondaryMarketTrade;

const resetTradeStore = () => store.dispatch(reset());

const completeVerify = (
  network: Network,
  holdId: string,
  assetAddress: string,
) => {
  store.dispatch(updateHoldVerificationNetwork(network));
  changeElementValue(FormFieldsTestId.DELIVERY_HOLD_ID, holdId);
  changeElementValue(FormFieldsTestId.DELIVERY_HOLD_ASSET, assetAddress);
};

const completeOverview = () => {
  changeElementValue(FormFieldsTestId.EXPIRES_IN, '1:0:0');
  clickElement(SaveFormSectionsTestId.OVERVIEW);
};

const completePaymentHoldSection = (
  network: Network,
  token: IToken,
  deliveryAccount: IUser,
  paymentAccount: IUser,
  quantity: string,
) => {
  store.dispatch(setPaymentHoldNetwork(network));
  store.dispatch(updatePaymentHoldAsset(token));
  store.dispatch(updatePaymentHoldRecipient(deliveryAccount));
  store.dispatch(updatePaymentHoldSender(paymentAccount));
  changeElementValue(FormFieldsTestId.PAYMENT_QUANTITY, quantity);
  clickElement(SaveFormSectionsTestId.PAYMENT);
};

describe('AcceptTrade page', () => {
  beforeEach(() => {
    resetTradeStore();
    renderTestBed(AcceptTrade);
  });

  describe('Verify Trade', () => {
    it('should fetch hold data with form values', (done) => {
      const network = craftNetworkStub();
      const token = craftTokenStub();
      const hold = craftHoldStub();
      mockedDataLayer.DataCall.mockResolvedValue({
        hold,
      });

      completeVerify(network, String(hold.id), String(token.defaultDeployment));
      clickElement(SaveFormSectionsTestId.VERIFY_TRADE);

      expect(dataLayer.DataCall).toHaveBeenLastCalledWith({
        method: API_FETCH_HOLD_DATA.method,
        path: API_FETCH_HOLD_DATA.path(),
        urlParams: {
          holdId: hold.id,
          tokenAddress: token.defaultDeployment,
          networkKey: network.key,
        },
      });
      done();
    });
  });

  describe('Payment', () => {
    beforeEach(() => {
      const network = craftNetworkStub();
      const hold = craftHoldStub();
      const token = craftTokenStub();
      store.dispatch(setActiveStep(1));
      store.dispatch(setDeliveryHoldAsset(token.defaultDeployment as string));
      store.dispatch(setDeliveryHold(hold));
      store.dispatch(setPaymentHolderNetwork(network));
    });

    it('should save overview section if data is correct', () => {
      completeOverview();
      expect(tradeStore().overview.isEditing).toBeFalsy();
      expect(query(FormFieldsTestId.EXPIRES_IN)).not.toBeInTheDocument();
      expect(tradeStore().errors[FormFields.EXPIRES_IN]).toBeFalsy();
    });

    it('should reopen overview section on edit click', () => {
      completeOverview();
      expect(tradeStore().overview.isEditing).toBeFalsy();
      expect(query(FormFieldsTestId.EXPIRES_IN)).not.toBeInTheDocument();
      clickElement(SaveFormSectionsTestId.OVERVIEW);
      expect(tradeStore().overview.isEditing).toBeTruthy();
      expect(query(FormFieldsTestId.EXPIRES_IN)).toBeInTheDocument();
    });

    it('should save payment section if data is correct', () => {
      const network = craftNetworkStub();
      const token = craftTokenStub();
      const accounts = craftUsersStub(2);

      completePaymentHoldSection(
        network,
        token,
        accounts[0],
        accounts[1],
        '50',
      );

      expect(tradeStore().paymentHoldDetails.isEditing).toBeFalsy();
      expect(query(FormFieldsTestId.PAYMENT_ASSET)).not.toBeInTheDocument();
      expect(tradeStore().errors[FormFields.PAYMENT_ASSET]).toBeFalsy();
      expect(tradeStore().errors[FormFields.PAYMENT_RECIPIENT]).toBeFalsy();
      expect(tradeStore().errors[FormFields.PAYMENT_SENDER]).toBeFalsy();
      expect(tradeStore().errors[FormFields.PAYMENT_QUANTITY]).toBeFalsy();
    });

    it('should create accepted paid order with right params', () => {
      const network = craftNetworkStub();
      const token = craftTokenStub();
      const hold = craftHoldStub();
      const order = craftWorkflowInstanceStub();
      const accounts = craftUsersStub(2);

      completeOverview();
      completePaymentHoldSection(
        network,
        token,
        accounts[0],
        accounts[1],
        '50',
      );
      mockedDataLayer.DataCall.mockResolvedValue({ order });
      clickElement(SaveFormSectionsTestId.ACCEPT_TRADE);

      expect(dataLayer.DataCall).toHaveBeenLastCalledWith({
        method: API_CREATE_SECONDARY_FORCE_PAID_ORDER.method,
        path: API_CREATE_SECONDARY_FORCE_PAID_ORDER.path(),
        body: {
          idempotencyKey: generateCode(),
          senderId: accounts[1].id,
          recipientId: accounts[0].id,
          paymentTokenId: token.id,
          paymentAssetClass: 'classa',
          paymentAmount: 50,
          orderType: OrderType.QUANTITY,
          dvpType: DvpType.ATOMIC,
          deliveryHoldId: hold.id,
          deliveryTokenNetworkKey: network.key,
          deliveryTokenAddress: tradeStore().deliveryHoldDetails.asset,
          deliveryTokenStandard: SmartContract.ERC1400_HOLDABLE_CERTIFICATE,
        },
      });
    });
  });
});
