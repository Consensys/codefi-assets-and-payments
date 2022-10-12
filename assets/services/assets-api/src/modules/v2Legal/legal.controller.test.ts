import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';

describe('LegalController', () => {
  let controller: LegalController;

  beforeEach(() => {
    controller = new LegalController(new LegalService());
  });

  it('Legal', async () => {
    await expect(true).toBe(true);
  });
});
