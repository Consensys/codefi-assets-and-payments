import createMockInstance from 'jest-create-mock-instance';

import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

describe('EmailController', () => {
  let controller: EmailController;
  let emailServiceMock: EmailService;
  let metadataMock: ApiMetadataCallService;

  beforeEach(() => {
    emailServiceMock = createMockInstance(EmailService);
    metadataMock = createMockInstance(ApiMetadataCallService);
    controller = new EmailController(emailServiceMock, metadataMock);
  });

  it('Email', async () => {
    await expect(true).toBe(true);
  });
});
