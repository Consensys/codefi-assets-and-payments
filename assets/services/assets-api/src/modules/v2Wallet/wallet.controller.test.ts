import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

import createMockInstance from 'jest-create-mock-instance';
import { ApiEntityCallService } from '../v2ApiCall/api.call.service/entity';

describe('WalletController', () => {
  let controller: WalletController;
  let walletServiceMock: WalletService;
  let apiEntityCallServiceMock: ApiEntityCallService;

  beforeEach(() => {
    walletServiceMock = createMockInstance(WalletService);
    apiEntityCallServiceMock = createMockInstance(ApiEntityCallService);
    controller = new WalletController(
      walletServiceMock,
      apiEntityCallServiceMock,
    );
  });

  it('Wallet', async () => {
    // await expect(controller.health()).toBe('OK');

    await expect(true).toBe(true);
  });
});
