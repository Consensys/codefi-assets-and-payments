import createMockInstance from 'jest-create-mock-instance';
import { ApiAdminCallService } from '../../v2ApiCall/api.call.service/admin';
import { NestJSPinoLogger } from '@consensys/observability';
import { TenantRoleMigrationService } from './tenantRoleMigration';
import { ClientApplication, keys } from '../../../types/clientApplication';
import { UserType } from 'src/types/user';
import { Auth0User } from 'src/types/authentication';
import { Role } from '@consensys/ts-types';
import { generateUser } from 'test/mockDataGenerators';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

const DRY_RUN_ENABLED = true;
const DRY_RUN_DISABLED = false;

jest.mock('src/types/authentication', () => ({
  craftAuth0TenantId: (tenantId) => tenantId,
}));

describe('TenantRoleMigration Service', () => {
  let service: TenantRoleMigrationService;
  let loggerMock: jest.Mocked<NestJSPinoLogger>;
  let apiAdminCallServiceMock: jest.Mocked<ApiAdminCallService>;
  let apiEntityCallServiceMock: jest.Mocked<ApiEntityCallService>;

  const tenantIdMock1 = 'testTenant1';
  const tenantIdMock2 = 'testTenant2';
  const errorMock1 = 'TestError1';
  const errorMock2 = 'TestError2';

  const tenantMock1 = {
    [keys.METADATA]: {
      [keys.METADATA__TENANT_ID]: tenantIdMock1,
    },
  } as ClientApplication;

  const tenantMock2 = {
    [keys.METADATA]: {
      [keys.METADATA__TENANT_ID]: tenantIdMock2,
    },
  } as ClientApplication;

  const createUserMock = (
    index = 0,
    userType = UserType.ADMIN,
    hasAuthId = true,
  ) => {
    return generateUser({
      overrideUser: {
        id: 'userId' + index,
        email: 'testEmail' + index,
        authId: hasAuthId ? 'authId' + index : undefined,
        userType,
      },
    });
  };

  const auth0UserMock = {
    appMetadata: {},
  } as Auth0User;

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger);
    apiAdminCallServiceMock = createMockInstance(ApiAdminCallService);
    apiEntityCallServiceMock = createMockInstance(ApiEntityCallService);
    service = new TenantRoleMigrationService(
      loggerMock,
      apiAdminCallServiceMock,
      apiEntityCallServiceMock,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [
      UserType.SUPERADMIN,
      [Role.ASSETS_ADMIN_STACK_ADMIN, Role.CODEFI_WALLET_OWNER],
    ],
    [
      UserType.ADMIN,
      [Role.ASSETS_ADMIN_TENANT_ADMIN, Role.CODEFI_WALLET_OWNER],
    ],
    [UserType.ISSUER, [Role.ASSETS_ADMIN_ISSUER, Role.CODEFI_WALLET_OWNER]],
    [
      UserType.UNDERWRITER,
      [Role.ASSETS_ADMIN_UNDERWRITER, Role.CODEFI_WALLET_OWNER],
    ],
    [UserType.BROKER, [Role.ASSETS_ADMIN_BROKER, Role.CODEFI_WALLET_OWNER]],
    [UserType.INVESTOR, [Role.ASSETS_ADMIN_INVESTOR, Role.CODEFI_WALLET_OWNER]],
    [UserType.VEHICLE, [Role.CODEFI_WALLET_OWNER]],
    [UserType.NOTARY, [Role.ASSETS_ADMIN_NOTARY, Role.CODEFI_WALLET_OWNER]],
    [UserType.VERIFIER, [Role.ASSETS_ADMIN_VERIFIER, Role.CODEFI_WALLET_OWNER]],
    [
      UserType.NAV_MANAGER,
      [Role.ASSETS_ADMIN_NAV_MANAGER, Role.CODEFI_WALLET_OWNER],
    ],
  ])(
    'updates tenant roles if not matching and user type is %s',
    async (userType, expectedTenantRoles) => {
      const userMock1 = createUserMock(1, userType);
      const userMock2 = createUserMock(2, userType);
      const userMock3 = createUserMock(3, userType);

      apiAdminCallServiceMock.listAllClientApplicationInAuth0.mockResolvedValue(
        [tenantMock1, tenantMock2],
      );

      apiEntityCallServiceMock.fetchEntities
        .mockResolvedValueOnce([userMock1])
        .mockResolvedValueOnce([userMock2, userMock3]);

      apiAdminCallServiceMock.retrieveUsersInAuth0ById.mockResolvedValue(
        auth0UserMock,
      );

      const result = await service.migrate(DRY_RUN_DISABLED);

      expect(result).toEqual({
        totalCount: 3,
        updatedCount: 3,
        skippedCount: 0,
        errorCount: 0,
        errors: [],
        start: expect.any(Date),
        finish: expect.any(Date),
        duration: expect.any(Number),
        dryRun: DRY_RUN_DISABLED,
      });

      expect(apiAdminCallServiceMock.updateUserInAuth0ById).toBeCalledTimes(3);

      expect(
        apiAdminCallServiceMock.updateUserInAuth0ById,
      ).toHaveBeenCalledWith(
        userMock1.tenantId,
        userMock1.authId,
        userMock1.id,
        expectedTenantRoles,
      );

      expect(
        apiAdminCallServiceMock.updateUserInAuth0ById,
      ).toHaveBeenCalledWith(
        userMock2.tenantId,
        userMock2.authId,
        userMock2.id,
        expectedTenantRoles,
      );

      expect(
        apiAdminCallServiceMock.updateUserInAuth0ById,
      ).toHaveBeenCalledWith(
        userMock3.tenantId,
        userMock3.authId,
        userMock3.id,
        expectedTenantRoles,
      );
    },
  );

  it('keeps existing tenant data when updating tenant roles', async () => {
    const userMock1 = createUserMock(1);

    const existingTenantData = {
      test1: 'testValue1',
      test2: 'testValue2',
    };

    apiAdminCallServiceMock.listAllClientApplicationInAuth0.mockResolvedValue([
      tenantMock1,
    ]);

    apiEntityCallServiceMock.fetchEntities.mockResolvedValueOnce([userMock1]);

    apiAdminCallServiceMock.retrieveUsersInAuth0ById.mockResolvedValue({
      ...auth0UserMock,
      appMetadata: {
        [tenantIdMock1]: existingTenantData,
      },
    } as unknown as Auth0User);

    const result = await service.migrate(DRY_RUN_DISABLED);

    expect(result).toEqual({
      totalCount: 1,
      updatedCount: 1,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      start: expect.any(Date),
      finish: expect.any(Date),
      duration: expect.any(Number),
      dryRun: DRY_RUN_DISABLED,
    });

    expect(apiAdminCallServiceMock.updateUserInAuth0ById).toBeCalledTimes(1);

    expect(apiAdminCallServiceMock.updateUserInAuth0ById).toHaveBeenCalledWith(
      userMock1.tenantId,
      userMock1.authId,
      userMock1.id,
      expect.any(Array),
    );
  });

  it('does not update tenant roles if not matching and dry run enabled', async () => {
    const userMock1 = createUserMock(1);
    const userMock2 = createUserMock(2);
    const userMock3 = createUserMock(3);

    apiAdminCallServiceMock.listAllClientApplicationInAuth0.mockResolvedValue([
      tenantMock1,
      tenantMock2,
    ]);

    apiEntityCallServiceMock.fetchEntities
      .mockResolvedValueOnce([userMock1])
      .mockResolvedValueOnce([userMock2, userMock3]);

    apiAdminCallServiceMock.retrieveUsersInAuth0ById.mockResolvedValue(
      auth0UserMock,
    );

    const result = await service.migrate(DRY_RUN_ENABLED);

    expect(result).toEqual({
      totalCount: 3,
      updatedCount: 3,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      start: expect.any(Date),
      finish: expect.any(Date),
      duration: expect.any(Number),
      dryRun: DRY_RUN_ENABLED,
    });

    expect(apiAdminCallServiceMock.updateUserInAuth0ById).toBeCalledTimes(0);
  });

  it('skips user if no auth ID', async () => {
    const userMock1 = createUserMock(1, UserType.ADMIN);
    const userMock2 = createUserMock(2, UserType.ADMIN, false);
    const userMock3 = createUserMock(3, UserType.ADMIN, false);

    apiAdminCallServiceMock.listAllClientApplicationInAuth0.mockResolvedValue([
      tenantMock1,
      tenantMock2,
    ]);

    apiEntityCallServiceMock.fetchEntities
      .mockResolvedValueOnce([userMock1])
      .mockResolvedValueOnce([userMock2, userMock3]);

    apiAdminCallServiceMock.retrieveUsersInAuth0ById.mockResolvedValue(
      auth0UserMock,
    );

    const result = await service.migrate(DRY_RUN_DISABLED);

    expect(result).toEqual({
      totalCount: 3,
      updatedCount: 1,
      skippedCount: 2,
      errorCount: 0,
      errors: [],
      start: expect.any(Date),
      finish: expect.any(Date),
      duration: expect.any(Number),
      dryRun: DRY_RUN_DISABLED,
    });

    expect(apiAdminCallServiceMock.updateUserInAuth0ById).toBeCalledTimes(1);

    expect(apiAdminCallServiceMock.updateUserInAuth0ById).toHaveBeenCalledWith(
      userMock1.tenantId,
      userMock1.authId,
      userMock1.id,
      expect.any(Array),
    );
  });

  it('skips user if tenant roles already match', async () => {
    const userMock1 = createUserMock(1, UserType.ADMIN);
    const userMock2 = createUserMock(2, UserType.ADMIN);
    const userMock3 = createUserMock(3, UserType.ADMIN);

    const auth0UserWithMatchingRolesMock = {
      ...auth0UserMock,
      appMetadata: {
        [tenantIdMock2]: {
          roles: ['Assets-TenantAdmin-Admin', 'Wallet Owner'],
        },
      },
    } as unknown as Auth0User;

    apiAdminCallServiceMock.listAllClientApplicationInAuth0.mockResolvedValue([
      tenantMock1,
      tenantMock2,
    ]);

    apiEntityCallServiceMock.fetchEntities
      .mockResolvedValueOnce([userMock1])
      .mockResolvedValueOnce([userMock2, userMock3]);

    apiAdminCallServiceMock.retrieveUsersInAuth0ById
      .mockResolvedValueOnce(auth0UserMock)
      .mockResolvedValueOnce(auth0UserWithMatchingRolesMock)
      .mockResolvedValueOnce(auth0UserWithMatchingRolesMock);

    const result = await service.migrate(DRY_RUN_DISABLED);

    expect(result).toEqual({
      totalCount: 3,
      updatedCount: 1,
      skippedCount: 2,
      errorCount: 0,
      errors: [],
      start: expect.any(Date),
      finish: expect.any(Date),
      duration: expect.any(Number),
      dryRun: DRY_RUN_DISABLED,
    });

    expect(apiAdminCallServiceMock.updateUserInAuth0ById).toBeCalledTimes(1);

    expect(apiAdminCallServiceMock.updateUserInAuth0ById).toHaveBeenCalledWith(
      userMock1.tenantId,
      userMock1.authId,
      userMock1.id,
      expect.any(Array),
    );
  });

  it('logs errors when retrieving auth0 user', async () => {
    const userMock1 = createUserMock(1);
    const userMock2 = createUserMock(2);
    const userMock3 = createUserMock(3);

    apiAdminCallServiceMock.listAllClientApplicationInAuth0.mockResolvedValue([
      tenantMock1,
      tenantMock2,
    ]);

    apiEntityCallServiceMock.fetchEntities
      .mockResolvedValueOnce([userMock1])
      .mockResolvedValueOnce([userMock2, userMock3]);

    apiAdminCallServiceMock.retrieveUsersInAuth0ById.mockResolvedValueOnce(
      auth0UserMock,
    );

    apiAdminCallServiceMock.retrieveUsersInAuth0ById
      .mockImplementationOnce(() => {
        throw new Error(errorMock1);
      })
      .mockImplementationOnce(() => {
        throw new Error(errorMock2);
      });

    const result = await service.migrate(DRY_RUN_DISABLED);

    expect(result).toEqual({
      totalCount: 3,
      updatedCount: 1,
      skippedCount: 0,
      errorCount: 2,
      errors: [
        {
          tenantId: tenantIdMock2,
          userEmail: userMock2.email,
          message: errorMock1,
          raw: expect.any(Error),
        },
        {
          tenantId: tenantIdMock2,
          userEmail: userMock3.email,
          message: errorMock2,
          raw: expect.any(Error),
        },
      ],
      start: expect.any(Date),
      finish: expect.any(Date),
      duration: expect.any(Number),
      dryRun: DRY_RUN_DISABLED,
    });

    expect(apiAdminCallServiceMock.updateUserInAuth0ById).toBeCalledTimes(1);

    expect(apiAdminCallServiceMock.updateUserInAuth0ById).toHaveBeenCalledWith(
      userMock1.tenantId,
      userMock1.authId,
      userMock1.id,
      expect.any(Array),
    );
  });

  it('logs errors when updating auth0 user', async () => {
    const userMock1 = createUserMock(1);
    const userMock2 = createUserMock(2);
    const userMock3 = createUserMock(3);

    apiAdminCallServiceMock.listAllClientApplicationInAuth0.mockResolvedValue([
      tenantMock1,
      tenantMock2,
    ]);

    apiEntityCallServiceMock.fetchEntities
      .mockResolvedValueOnce([userMock1])
      .mockResolvedValueOnce([userMock2, userMock3]);

    apiAdminCallServiceMock.retrieveUsersInAuth0ById.mockResolvedValue(
      auth0UserMock,
    );

    apiAdminCallServiceMock.updateUserInAuth0ById
      .mockResolvedValueOnce({} as Auth0User)
      .mockImplementationOnce(() => {
        throw new Error(errorMock1);
      })
      .mockImplementationOnce(() => {
        throw new Error(errorMock2);
      });

    const result = await service.migrate(DRY_RUN_DISABLED);

    expect(result).toEqual({
      totalCount: 3,
      updatedCount: 1,
      skippedCount: 0,
      errorCount: 2,
      errors: [
        {
          tenantId: tenantIdMock2,
          userEmail: userMock2.email,
          message: errorMock1,
          raw: expect.any(Error),
        },
        {
          tenantId: tenantIdMock2,
          userEmail: userMock3.email,
          message: errorMock2,
          raw: expect.any(Error),
        },
      ],
      start: expect.any(Date),
      finish: expect.any(Date),
      duration: expect.any(Number),
      dryRun: DRY_RUN_DISABLED,
    });
  });

  it('does nothing if no tenants', async () => {
    apiAdminCallServiceMock.listAllClientApplicationInAuth0.mockResolvedValue(
      [],
    );
    const result = await service.migrate(DRY_RUN_DISABLED);

    expect(result).toEqual({
      totalCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      start: expect.any(Date),
      finish: expect.any(Date),
      duration: expect.any(Number),
      dryRun: DRY_RUN_DISABLED,
    });

    expect(apiAdminCallServiceMock.updateUserInAuth0ById).toBeCalledTimes(0);
  });

  it.each([
    ['no metadata', {}],
    ['no tenant id', { [keys.METADATA]: {} }],
  ])('skips tenants with %s', async (title, tenant) => {
    const userMock1 = createUserMock(1);
    const userMock2 = createUserMock(2);

    apiAdminCallServiceMock.listAllClientApplicationInAuth0.mockResolvedValue([
      tenant as ClientApplication,
      tenantMock1,
    ]);

    apiEntityCallServiceMock.fetchEntities
      .mockResolvedValueOnce([userMock1])
      .mockResolvedValueOnce([userMock2]);

    apiAdminCallServiceMock.retrieveUsersInAuth0ById.mockResolvedValue(
      auth0UserMock,
    );

    const result = await service.migrate(DRY_RUN_DISABLED);

    expect(result).toEqual({
      totalCount: 1,
      updatedCount: 1,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      start: expect.any(Date),
      finish: expect.any(Date),
      duration: expect.any(Number),
      dryRun: DRY_RUN_DISABLED,
    });

    expect(apiAdminCallServiceMock.updateUserInAuth0ById).toBeCalledTimes(1);

    expect(apiAdminCallServiceMock.updateUserInAuth0ById).toHaveBeenCalledWith(
      userMock1.tenantId,
      userMock1.authId,
      userMock1.id,
      expect.any(Array),
    );
  });

  it('does nothing if tenant has no users', async () => {
    apiAdminCallServiceMock.listAllClientApplicationInAuth0.mockResolvedValue([
      tenantMock1,
    ]);

    apiEntityCallServiceMock.fetchEntities.mockResolvedValueOnce([]);

    const result = await service.migrate(DRY_RUN_DISABLED);

    expect(result).toEqual({
      totalCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      start: expect.any(Date),
      finish: expect.any(Date),
      duration: expect.any(Number),
      dryRun: DRY_RUN_DISABLED,
    });

    expect(apiAdminCallServiceMock.updateUserInAuth0ById).toBeCalledTimes(0);
  });
});
