import { EthController } from './eth.controller';

describe('EthController', () => {
  let controller: EthController;

  beforeEach(() => {
    controller = new EthController();
  });

  it('Eth', async () => {
    await expect(true).toBe(true);
  });
});
