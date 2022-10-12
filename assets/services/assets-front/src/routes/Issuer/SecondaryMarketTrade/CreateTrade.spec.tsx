import store from '../../../features/app.store';
import { CreateTrade } from './CreateTrade';
import '@testing-library/jest-dom';
import {
  FormFields,
  reset,
  selectDeliveryHolderAsset,
  selectDeliveryHolderRecipient,
  selectDeliveryHolderSender,
  setNetwork,
} from '../../../features/trades/create.store';
import {
  changeElementValue,
  clickElement,
  id,
  query,
  renderTestBed,
} from '../../../../test/testBed';
import {
  craftNetworkStub,
  craftTokensStub,
  craftTokenStub,
  craftUsersStub,
  craftUserStub,
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
import { API_CREATE_SECONDARY_FORCE_TRADE_ORDER } from '../../../constants/apiRoutes';
import { generateCode } from '../../../utils/commonUtils';

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
  EXPIRES_IN_ERROR = 'field_error-expiresIn',
  NETWORK = 'field_network',
  NETWORK_ERROR = 'field_error-network',
  DELIVERY_ASSET = 'field-deliveryAsset',
  DELIVERY_ACCOUNT = 'field-deliveryAccount',
  DELIVERY_SENDER = 'field-deliverySender',
  DELIVERY_RECIPIENT = 'field-deliveryRecipient',
  DELIVERY_QUANTITY = 'field-deliveryQuantity',
  PAYMENT_ASSET = 'field-paymentAsset',
  PAYMENT_SENDER = 'field-paymentSender',
  PAYMENT_RECIPIENT = 'field-paymentRecipient',
  PAYMENT_QUANTITY = 'field-paymentQuantity',
}

enum SaveFormSectionsTestId {
  OVERVIEW = 'save-overview',
  DELIVERY = 'save-delivery',
  PAYMENT = 'save-payment',
  CREATE_TRADE = 'create-trade',
}

const tradeStore = () => store.getState().createSecondaryMarketTrade;

const resetTradeStore = () => store.dispatch(reset());

const completeOverview = (network: Network, expiresIn: string) => {
  changeElementValue(FormFieldsTestId.EXPIRES_IN, expiresIn);
  store.dispatch(setNetwork(network));
  clickElement(SaveFormSectionsTestId.OVERVIEW);
};

const completeDeliveryHoldSection = (
  token: IToken,
  sender: IUser,
  recipient: IUser,
  quantity: string,
) => {
  store.dispatch(selectDeliveryHolderAsset(token));
  store.dispatch(selectDeliveryHolderSender(sender));
  store.dispatch(selectDeliveryHolderRecipient(recipient));
  changeElementValue(FormFieldsTestId.DELIVERY_QUANTITY, quantity);
  clickElement(SaveFormSectionsTestId.DELIVERY);
};

const completePaymentHoldSection = (
  token: string,
  sender: string,
  recipient: string,
  quantity: string,
) => {
  changeElementValue(FormFieldsTestId.PAYMENT_ASSET, token);
  changeElementValue(FormFieldsTestId.PAYMENT_SENDER, sender);
  changeElementValue(FormFieldsTestId.PAYMENT_RECIPIENT, recipient);
  changeElementValue(FormFieldsTestId.PAYMENT_QUANTITY, quantity);
  clickElement(SaveFormSectionsTestId.PAYMENT);
};

describe('CreateTrade page', () => {
  beforeEach(() => {
    resetTradeStore();
    renderTestBed(CreateTrade);
  });

  it('should render first wizard page', () => {
    expect(id('create-trade-form')).toBeInTheDocument();
  });

  describe('Overview Section', () => {
    it('should not save overview section if expiresIn and network are missing', () => {
      clickElement(SaveFormSectionsTestId.OVERVIEW);
      expect(tradeStore().overview.isEditing).toBeTruthy();
      expect(tradeStore().errors[FormFields.EXPIRES_IN]).toBeTruthy();
      expect(tradeStore().errors[FormFields.NETWORK]).toBeTruthy();
    });

    it('should save overview section if expiresIn is > 86400', () => {
      const network = craftNetworkStub();
      completeOverview(network, '12:0:0');
      expect(tradeStore().overview.isEditing).toBeFalsy();
      expect(query(FormFieldsTestId.EXPIRES_IN)).not.toBeInTheDocument();
      expect(tradeStore().errors[FormFields.EXPIRES_IN]).toBeFalsy();
    });

    it('should reopen overview section on edit click', () => {
      const network = craftNetworkStub();
      completeOverview(network, '12:0:0');
      expect(tradeStore().overview.isEditing).toBeFalsy();
      expect(query(FormFieldsTestId.EXPIRES_IN)).not.toBeInTheDocument();
      clickElement(SaveFormSectionsTestId.OVERVIEW);
      expect(tradeStore().overview.isEditing).toBeTruthy();
      expect(query(FormFieldsTestId.EXPIRES_IN)).toBeInTheDocument();
    });
  });

  describe('Delivery Holder Section', () => {
    it('should save delivery section if completed', () => {
      const token = craftTokenStub();
      const investors = craftUsersStub(2);
      const quantity = '1000';
      completeDeliveryHoldSection(token, investors[0], investors[1], quantity);
      expect(tradeStore().deliveryHolder.isEditing).toBeFalsy();
      expect(query(FormFieldsTestId.DELIVERY_ACCOUNT)).not.toBeInTheDocument();
      expect(tradeStore().errors[FormFields.DELIVERY_SENDER]).toBeFalsy();
      expect(tradeStore().errors[FormFields.DELIVERY_RECIPIENT]).toBeFalsy();
    });
  });

  describe('Payment Holder Section', () => {
    it('should save payment section if completed', () => {
      const [deliveryToken, paymentToken] = craftTokensStub(2);
      const investors = craftUsersStub(2);
      const quantity = '1000';
      completeDeliveryHoldSection(
        deliveryToken,
        investors[0],
        investors[1],
        quantity,
      ); // some fields are required to complete the payment
      completePaymentHoldSection(
        paymentToken.defaultDeployment as string,
        investors[1].defaultWallet as string,
        investors[0].defaultWallet as string,
        quantity,
      );
      expect(tradeStore().paymentHolder.isEditing).toBeFalsy();
      expect(query(FormFieldsTestId.PAYMENT_ASSET)).not.toBeInTheDocument();
      expect(tradeStore().errors[FormFields.PAYMENT_SENDER]).toBeFalsy();
      expect(tradeStore().errors[FormFields.PAYMENT_RECIPIENT]).toBeFalsy();
    });
  });

  describe('Trade Creation', () => {
    it('should call the trade creation method with the right params', () => {
      const network = craftNetworkStub();
      const [deliveryToken, paymentToken] = craftTokensStub(2);
      const investors = craftUsersStub(2);
      const quantity = '1000';
      const workflowInstanceStub = craftWorkflowInstanceStub();

      mockedDataLayer.DataCall.mockResolvedValue({
        order: workflowInstanceStub,
      });

      completeOverview(network, '12:0:0');
      completeDeliveryHoldSection(
        deliveryToken,
        investors[0],
        investors[1],
        quantity,
      ); // some fields are required to complete the payment
      completePaymentHoldSection(
        paymentToken.defaultDeployment as string,
        investors[1].defaultWallet as string,
        investors[0].defaultWallet as string,
        quantity,
      );
      clickElement(SaveFormSectionsTestId.CREATE_TRADE);

      expect(dataLayer.DataCall).toHaveBeenLastCalledWith({
        method: API_CREATE_SECONDARY_FORCE_TRADE_ORDER.method,
        path: API_CREATE_SECONDARY_FORCE_TRADE_ORDER.path(),
        body: {
          idempotencyKey: generateCode(),
          orderType: OrderType.QUANTITY,
          dvpType: DvpType.ATOMIC,
          senderId: investors[0].id,
          recipientId: investors[0].id,
          tokenId: deliveryToken.id,
          quantity: parseInt(quantity),
          assetClass: deliveryToken.assetClasses?.[0],
          paymentTokenAddess: paymentToken.defaultDeployment,
          paymentTokenStandard: SmartContract.ERC1400_HOLDABLE_CERTIFICATE,
          amount: parseInt(quantity),
          paymentAccountAddress: investors[0].defaultWallet,
        },
      });
    });
  });
});
