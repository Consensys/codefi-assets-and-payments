import { UserTokenService } from '@consensys/auth'
import { TestingModule } from '@nestjs/testing'
import {
  DEV_CODEFI_API_AUDIENCE,
  DEV_TEST_WEB_CLIENT_ID,
  DEV_TEST_WEB_CLIENT_SECRET,
  INTEGRATION_TEST_USER_PASSWORD,
} from './configs'

const USER_WITH_TENANT_ID_1_ENTITY_ID_1 =
  'userwithtenantId1entityId1@example.com'
const USER_WITH_TENANT_ID_1_ENTITY_ID_2 =
  'userwithtenantid1entityid2@example.com'
const USER_WITHOUT_TENANT_ID = 'userwithouttenantId@example.com'
const USER_WITHOUT_PERMISSIONS = 'userwithoutpermissions@example.com'

export const getTokenWithTenantId1EntityId1 = (appModule: TestingModule) =>
  getToken(appModule, USER_WITH_TENANT_ID_1_ENTITY_ID_1, INTEGRATION_TEST_USER_PASSWORD)

export const getTokenWithTenantId1EntityId2 = (appModule: TestingModule) =>
  getToken(appModule, USER_WITH_TENANT_ID_1_ENTITY_ID_2, INTEGRATION_TEST_USER_PASSWORD)

export const getTokenWithoutTenantId = (appModule: TestingModule) =>
  getToken(appModule, USER_WITHOUT_TENANT_ID, INTEGRATION_TEST_USER_PASSWORD)

export const getTokenWithoutPermissions = (appModule: TestingModule) =>
  getToken(appModule, USER_WITHOUT_PERMISSIONS, INTEGRATION_TEST_USER_PASSWORD)

const getToken = (
  appModule: TestingModule,
  userName: string,
  password: string,
) => {
  const userAuthTokenService = appModule.get(UserTokenService)

  return userAuthTokenService.createUserToken(
    DEV_TEST_WEB_CLIENT_ID,
    DEV_TEST_WEB_CLIENT_SECRET,
    DEV_CODEFI_API_AUDIENCE,
    userName,
    password,
  )
}
