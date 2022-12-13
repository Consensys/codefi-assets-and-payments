import { NestJSPinoLogger } from '@consensys/observability';
import { LinkService } from 'src/modules/v2Link/link.service';
import { User, UserExample } from 'src/types/user';
import { KycCheckService } from 'src/modules/v2KYCCheck/kyc.check.service';
import { ApiKycCallService } from 'src/modules/v2ApiCall/api.call.service/kyc';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { KYCDataService } from 'src/modules/v2KYCData/kyc.data.service';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiMailingCallService } from 'src/modules/v2ApiCall/api.call.service/mailing';
import { UserRetrievalService } from 'src/modules/v2User/user.service/retrieveUser';
import { UserListingService } from 'src/modules/v2User/user.service/listAllUsers';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { MAX_KYC_VERIFIERS } from 'src/modules/v2KYCWorkflow/kyc.workflow.service/workflow';
import { KYCWorkflowGenericService } from './workflow';
import { HttpException } from '@nestjs/common';
import { keys as ConfigKeys, Config, ConfigExample } from 'src/types/config';
import createMockInstance from 'jest-create-mock-instance';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

describe('kyc.workflow.service workflow', () => {
  let entityService: jest.Mocked<EntityService>;
  let walletService: jest.Mocked<WalletService>;
  let workflowService: jest.Mocked<ApiWorkflowWorkflowInstanceService>;
  let kycDataService: jest.Mocked<KYCDataService>;
  let kycCheckHelperService: jest.Mocked<KycCheckService>;
  let linkService: jest.Mocked<LinkService>;
  let apiKycCallService: jest.Mocked<ApiKycCallService>;
  let apiEntityCallService: jest.Mocked<ApiEntityCallService>;
  let apiMailingCallService: jest.Mocked<ApiMailingCallService>;
  let userRetrievalService: jest.Mocked<UserRetrievalService>;
  let userListingService: jest.Mocked<UserListingService>;
  let configService: jest.Mocked<ConfigService>;
  let kycWorkflowGenericService: KYCWorkflowGenericService;
  let logger: jest.Mocked<NestJSPinoLogger>;
  const createInstance = () => {
    entityService = createMockInstance(EntityService);
    walletService = createMockInstance(WalletService);
    workflowService = createMockInstance(ApiWorkflowWorkflowInstanceService);
    kycDataService = createMockInstance(KYCDataService);
    kycCheckHelperService = createMockInstance(KycCheckService);
    linkService = createMockInstance(LinkService);
    apiKycCallService = createMockInstance(ApiKycCallService);
    apiEntityCallService = createMockInstance(ApiEntityCallService);
    apiMailingCallService = createMockInstance(ApiMailingCallService);
    userRetrievalService = createMockInstance(UserRetrievalService);
    userListingService = createMockInstance(UserListingService);
    configService = createMockInstance(ConfigService);
    logger = createMockInstance(NestJSPinoLogger);
    kycWorkflowGenericService = new KYCWorkflowGenericService(
      logger,
      entityService,
      walletService,
      workflowService,
      kycDataService,
      kycCheckHelperService,
      linkService,
      apiKycCallService,
      apiEntityCallService,
      apiMailingCallService,
      userRetrievalService,
      userListingService,
      configService,
    );
  };

  beforeEach(() => {
    createInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendToAllKYCVerifiers', () => {
    const tenantId = '';
    const issuerId = '';
    const submitter: User = {} as User;
    const authToken = '';
    const maxCount = MAX_KYC_VERIFIERS;
    let enable = true;
    let userCount = 10;
    let users = Array.from(Array(userCount).keys()).map(() => UserExample);

    beforeEach(() => {
      userListingService.listAllUsersLinkedToIssuer.mockImplementation(
        async () => {
          return Promise.resolve({
            users: users,
            total: userCount,
          });
        },
      );
      apiMailingCallService.sendKYCSubmittedNotificationToAllKYCVerifier.mockResolvedValueOnce();

      configService.retrieveTenantConfig.mockImplementation(async () => {
        const config = Object.assign({}, ConfigExample) as unknown as Config;
        config[ConfigKeys.DATA][ConfigKeys.DATA__ENABLE_NOTIFY_ALL_VERIFIERS] =
          enable;
        return Promise.resolve(config);
      });

      logger.warn.mockReturnValueOnce();
    });
    afterEach(() => {
      userCount = 10;
      users = Array.from(Array(userCount).keys()).map(() => UserExample);
      enable = true;
    });

    describe(`when send ${ConfigKeys.DATA__ENABLE_NOTIFY_ALL_VERIFIERS} enabled`, () => {
      it('should send mail', async () => {
        await kycWorkflowGenericService['sendToAllKYCVerifiers'](
          tenantId,
          issuerId,
          submitter,
          authToken,
        );
        expect(
          apiMailingCallService.sendKYCSubmittedNotificationToAllKYCVerifier,
        ).toBeCalledTimes(1);
      });
    });

    describe(`when send ${ConfigKeys.DATA__ENABLE_NOTIFY_ALL_VERIFIERS} disabled`, () => {
      beforeEach(() => {
        enable = false;
      });
      it('should not send mail', async () => {
        await kycWorkflowGenericService['sendToAllKYCVerifiers'](
          tenantId,
          issuerId,
          submitter,
          authToken,
        );
        expect(
          apiMailingCallService.sendKYCSubmittedNotificationToAllKYCVerifier,
        ).toBeCalledTimes(0);
      });
    });

    describe('when Verifiers return more than zero result', () => {
      it('should send mail', async () => {
        await kycWorkflowGenericService['sendToAllKYCVerifiers'](
          tenantId,
          issuerId,
          submitter,
          authToken,
        );
        expect(
          apiMailingCallService.sendKYCSubmittedNotificationToAllKYCVerifier,
        ).toBeCalledTimes(1);
        expect(
          apiMailingCallService.sendKYCSubmittedNotificationToAllKYCVerifier,
        ).toBeCalledWith(tenantId, users, submitter, authToken);
      });

      describe(`return more than ${maxCount} result`, () => {
        beforeEach(() => {
          userCount = 1001;
          users = Array.from(Array(maxCount).keys()).map(() => UserExample);
        });

        it(`should send ${maxCount} email and log message`, async () => {
          await kycWorkflowGenericService['sendToAllKYCVerifiers'](
            tenantId,
            issuerId,
            submitter,
            authToken,
          );

          expect(
            apiMailingCallService.sendKYCSubmittedNotificationToAllKYCVerifier,
          ).toBeCalledTimes(1);

          expect(logger.warn).toBeCalledWith(
            `sendToAllKYCVerifers --> Too many verifers retrieved. Expect to have maximum ${maxCount} users retrieve, but got ${userCount}`,
          );

          expect(
            apiMailingCallService.sendKYCSubmittedNotificationToAllKYCVerifier,
          ).toBeCalledWith(tenantId, users, submitter, authToken);
        });
      });
    });

    describe('when Verifiers return zero result', () => {
      beforeEach(() => {
        userCount = 0;
        users = [];
      });

      it('should not send mail', async () => {
        await kycWorkflowGenericService['sendToAllKYCVerifiers'](
          tenantId,
          issuerId,
          submitter,
          authToken,
        );
        expect(
          apiMailingCallService.sendKYCSubmittedNotificationToAllKYCVerifier,
        ).toBeCalledTimes(0);
      });
    });

    describe('when fetching Verifiers return error', () => {
      beforeEach(() => {
        userListingService.listAllUsersLinkedToIssuer.mockRejectedValue(
          new Error('error'),
        );
      });

      it('should not send email', async () => {
        try {
          await kycWorkflowGenericService['sendToAllKYCVerifiers'](
            tenantId,
            issuerId,
            submitter,
            authToken,
          );
        } catch (e) {
          expect(e).toBeInstanceOf(HttpException);
          expect(
            apiMailingCallService.sendKYCSubmittedNotificationToAllKYCVerifier,
          ).toBeCalledTimes(0);
        }
      });
    });
  });
});
