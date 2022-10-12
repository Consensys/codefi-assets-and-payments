import store from '../../../features/app.store';
import '@testing-library/jest-dom';
import {
  changeElementValue,
  clickElement,
  query,
  renderTestBed,
} from '../../../../test/testBed';
import {
  craftHoldStub,
  craftNetworkStub,
  craftWorkflowInstanceStub,
} from '../../../../test/stubFactory';
import { Network } from '../../../types/Network';
import { IWorkflowInstance } from '../AssetIssuance/templatesTypes';
import * as dataLayer from '../../../utils/dataLayer';
import { API_FETCH_HOLD_DATA } from '../../../constants/apiRoutes';
import { SettleTrade } from './SettleTrade';
import {
  reset,
  setOrder,
  setPaymentHoldNetwork,
} from 'features/trades/settle.store';

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

const mockedDataLayer = dataLayer as jest.Mocked<typeof dataLayer>;

enum FormFieldsTestId {
  EXPIRES_IN = 'field-expiresIn',
  PAYMENT_HOLD_ID = 'field-paymentHoldId',
}

enum SaveFormSectionsTestId {
  VERIFY_PAYMENT = 'verify-payment',
  SETTLE_TRADE = 'settle-trade',
}

const resetTradeStore = () => store.dispatch(reset());

const completeVerify = (
  network: Network,
  holdId: string,
  order: IWorkflowInstance,
) => {
  store.dispatch(setPaymentHoldNetwork(network));
  store.dispatch(setOrder(order));
  changeElementValue(FormFieldsTestId.PAYMENT_HOLD_ID, holdId);
};

describe('SettleTrade page', () => {
  beforeEach(() => {
    resetTradeStore();
    renderTestBed(SettleTrade);
  });

  describe('Verify Payment', () => {
    it('should fetch hold data with form values', (done) => {
      const network = craftNetworkStub();
      const hold = craftHoldStub();
      const order = craftWorkflowInstanceStub();
      mockedDataLayer.DataCall.mockResolvedValue({
        hold,
      });

      completeVerify(network, String(hold.id), order);
      clickElement(SaveFormSectionsTestId.VERIFY_PAYMENT);

      expect(dataLayer.DataCall).toHaveBeenLastCalledWith({
        method: API_FETCH_HOLD_DATA.method,
        path: API_FETCH_HOLD_DATA.path(),
        urlParams: {
          holdId: hold.id,
          tokenAddress: order.data?.dvp?.payment?.tokenAddress,
          networkKey: network.key,
        },
      });
      done();
    });
  });
});
