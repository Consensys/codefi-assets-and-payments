import { DocumentController } from './document.controller';
import createMockInstance from 'jest-create-mock-instance';
import { ApiDocumentCallService } from 'src/modules/v2ApiCall/api.call.service/document';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { UserRetrievalService } from 'src/modules/v2User/user.service/retrieveUser';

describe('DocumentController', () => {
  let controller: DocumentController;
  let apiDocumentCallServiceMock: ApiDocumentCallService;
  let userRetrievalServiceMock: UserRetrievalService;
  let loggerMock: NestJSPinoLogger;

  beforeEach(() => {
    apiDocumentCallServiceMock = createMockInstance(ApiDocumentCallService);
    userRetrievalServiceMock = createMockInstance(UserRetrievalService);
    loggerMock = createMockInstance(NestJSPinoLogger);
    controller = new DocumentController(
      loggerMock,
      apiDocumentCallServiceMock,
      userRetrievalServiceMock,
    );
  });

  it('Document', async () => {
    await expect(true).toBe(true);
  });
});
