import { TransactionController } from './transaction.controller';
import { TransactionHelperService } from './transaction.service';

import createMockInstance from 'jest-create-mock-instance';
import { ApiEntityCallService } from '../v2ApiCall/api.call.service/entity';

describe('TransactionController', () => {
  let controller: TransactionController;
  let transactionHelperServiceMock: TransactionHelperService;
  let apiEntityCallServiceMock: ApiEntityCallService;

  beforeEach(() => {
    transactionHelperServiceMock = createMockInstance(TransactionHelperService);
    apiEntityCallServiceMock = createMockInstance(ApiEntityCallService);
    controller = new TransactionController(
      transactionHelperServiceMock,
      apiEntityCallServiceMock,
    );
  });

  it('Transaction', async () => {
    await expect(true).toBe(true);
  });
});
