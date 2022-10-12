import { OrchestrateUtils } from '@codefi-assets-and-payments/nestjs-orchestrate'
import { ClientType, WalletType } from '@codefi-assets-and-payments/ts-types'
import { v4 as uuidv4 } from 'uuid'

export const tenantIdMock = 'tenantId1'
export const tenantIdMock2 = 'tenantId2'
export const entityIdMock = 'entityId1'
export const entityIdMock2 = 'entityId2'
export const subjectMock = 'RYTOqc1V1Ncpl7666UDr9NsTTJtpzr8a@clients'

export const authTokenMock =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik4wSXdNRE13TVRReVJrSkRSVFJDUXpNd00wSTRNemt3UVRsQlF6TTNRMFJET1RnME56ZEJPUSJ9.eyJodHRwczovL2FwaS5jb2RlZmkubmV0d29yayI6eyJ0ZW5hbnRJZCI6InRlbmFudElkMSJ9LCJodHRwczovL2FwaS5vcmNoZXN0cmF0ZS5uZXR3b3JrIjp7InRlbmFudF9pZCI6InRlbmFudElkMSJ9LCJpc3MiOiJodHRwczovL2NvZGVmaS5ldS5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NWVhODU0MDRmM2VkOTAwYzE4MDdiMmMyIiwiYXVkIjpbImh0dHBzOi8vYXBpLmNvZGVmaS5uZXR3b3JrIiwiaHR0cHM6Ly9jb2RlZmkuZXUuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTYyODQyNDI1NSwiZXhwIjoxNjI4NTEwNjU1LCJhenAiOiJWUWFZUWt1QjdMc3FxczdPSDRnMVdxQmx3S2hPZ1NydyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJndHkiOiJwYXNzd29yZCIsInBlcm1pc3Npb25zIjpbImFjY2VwdDppbnN0cnVjdGlvbiIsImFwcHJvdmU6ZGlnaXRhbC1jdXJyZW5jeSIsImFwcHJvdmU6bGVnYWwtZW50aXR5IiwiYnVybjpkaWdpdGFsLWN1cnJlbmN5IiwiYnVybjp0b2tlbiIsImNyZWF0ZTpsZWdhbC1lbnRpdHkiLCJkZWxldGU6ZGF0YSIsImRlbGV0ZTpvcmFjbGUiLCJkZWxldGU6c2NoZW1hIiwiZGVsZXRlOnRlbmFudCIsImRlcGxveTpkaWdpdGFsLWN1cnJlbmN5IiwiZGVwbG95OnRva2VuIiwiZGVwb3NpdDpkaWdpdGFsLWN1cnJlbmN5IiwiZXhlY3V0ZWhvbGQ6Y29uZmlkZW50aWFsdG9rZW4iLCJleGVjdXRlSG9sZDpkaWdpdGFsLWN1cnJlbmN5IiwiZXhlY3V0ZWhvbGQ6dG9rZW4iLCJob2xkOmNvbmZpZGVudGlhbHRva2VuIiwiaG9sZDpkaWdpdGFsLWN1cnJlbmN5IiwiaG9sZDp0b2tlbiIsIm1pbnQ6Y29uZmlkZW50aWFsdG9rZW4iLCJtaW50OmRpZ2l0YWwtY3VycmVuY3kiLCJtaW50OnRva2VuIiwicmVhZGFsbDpkaWdpdGFsLWN1cnJlbmN5LW9wZXJhdGlvbnMiLCJyZWFkOmF0dGVzdGF0aW9uIiwicmVhZDpjYXNoLWFjY291bnQiLCJyZWFkOmNoYW5uZWwiLCJyZWFkOmNvbmZpZGVudGlhbHRva2VuIiwicmVhZDpkYXRhIiwicmVhZDpkaWdpdGFsLWN1cnJlbmN5IiwicmVhZDpkaWdpdGFsLWN1cnJlbmN5LWhvbGRlcnMiLCJyZWFkOmRpZ2l0YWwtY3VycmVuY3ktb3BlcmF0aW9ucyIsInJlYWQ6aW5zdHJ1Y3Rpb24iLCJyZWFkOmxlZ2FsLWVudGl0eSIsInJlYWQ6bm90aWZpY2F0aW9uIiwicmVhZDpvcmFjbGUiLCJyZWFkOnNjaGVtYSIsInJlYWQ6dGVuYW50IiwicmVhZDp0b2tlbiIsInJlYWQ6dXNlciIsInJlamVjdDppbnN0cnVjdGlvbiIsInJlbGVhc2VIb2xkOmRpZ2l0YWwtY3VycmVuY3kiLCJ0cmFuc2ZlcjpkaWdpdGFsLWN1cnJlbmN5IiwidHJhbnNmZXJGcm9tOmRpZ2l0YWwtY3VycmVuY3kiLCJ0cmFuc2Zlcjp0b2tlbiIsInVwZGF0ZTpkYXRhIiwidXBkYXRlOm9yYWNsZSIsIndpdGhkcmF3OmRpZ2l0YWwtY3VycmVuY3kiLCJ3cml0ZTphY2NvdW50Iiwid3JpdGU6YXR0ZXN0YXRpb24iLCJ3cml0ZTphenRlY2FjY291bnQiLCJ3cml0ZTpjYXNoLWFjY291bnQiLCJ3cml0ZTpjaGFubmVsIiwid3JpdGU6Y29uZmlkZW50aWFsdG9rZW4iLCJ3cml0ZTpkYXRhIiwid3JpdGU6b3BlcmF0aW9uc19yZXF1ZXN0Iiwid3JpdGU6b3BlcmF0aW9uc19yZXNvbHZlIiwid3JpdGU6b3JhY2xlIiwid3JpdGU6c2NoZW1hIiwid3JpdGU6dGVuYW50Il19.U4CVVxXLtbq_3qHJpn25hRUpFGaaL7a0Gukia6R0J7obWCddEOxst35ftdNZObOVeadBcec0cJC_PJYkoAxEjl7jMN-h2gPbZvcWvWjfqO77AKkWcJoGSuWcSEjGEQyN-lscYWluqRPUBuMf5nCTCseGgoEB8vKToTAVP1XjClAcKZ9IVO6uqfKfcRSMEaZk-aVXPxkum1q3yS0ePfutdHfTqAsvZv6gt5O8zEmGTsrMY1R6J2dCa90F0Uj9QM-hPY4R3Qh_Gd1O6T02Gg3VRvcjYjwtOJnDXdIZNw48MbWwa9McwtfzK1hqZ2IO9_YT7YoBE9dyx1Qe0EXzD2gAPg'
export const authHeadersMock =
  OrchestrateUtils.buildOrchestrateHeadersForTenant(tenantIdMock, entityIdMock)

export const tenantMock = {
  id: tenantIdMock,
  name: 'Tenant 1',
  products: {
    assets: true,
    payments: true,
    compliance: true,
    staking: false,
    workflows: false,
  },
  defaultNetworkKey: 'mainnet',
  metadata: {
    field1: 'field1',
    field2: 'field2',
  },
}

export const tenantUpdateMock = {
  name: 'Tenant 1 - New Name',
  products: {
    assets: false,
    payments: false,
    compliance: false,
    staking: false,
    workflows: true,
  },
  defaultNetworkKey: 'testnet',
  metadata: {
    field1: 'field1',
    field3: 'field3',
    field4: 'field4',
  },
}

export const entityMock = {
  id: entityIdMock,
  name: 'Entity 1',
  metadata: {
    field1: 'field1',
    field2: 'field2',
  },
}

export const entityUpdateMock = {
  name: 'Entity 1 - New Name',
  metadata: {
    field1: 'field1',
    field3: 'field3',
    field4: 'field4',
  },
}

export const initialAdminsMock = [
  {
    email: 'admin1@entity1.com',
    name: 'Admin 1',
  },
  {
    email: 'admin2@entity2.com',
    name: 'Admin 2',
  },
]

export const walletAddressMock = '0x87Ea0683442a78F6030fF5a569165e1B91fcFcb5'
export const walletAddressMock2 = '0xd4182dAe450AB12Ae250833786181D99C83F5582'
export const walletAddressMock3 = '0xBCA0ddA255A658A9d4154f03d495200Bba2F0B16'
export const walletAddressWithoutChecksumMock = walletAddressMock.toLowerCase()
export const walletAddressWithoutChecksumMock2 =
  walletAddressMock2.toLowerCase()
export const walletAddressWithoutChecksumMock3 =
  walletAddressMock3.toLowerCase()

export const walletMock = {
  address: walletAddressMock,
  type: WalletType.EXTERNAL_OTHER,
  metadata: {
    field3: 'field3',
  },
}

export const walletUpdateMock = {
  metadata: {
    field99: 'field99',
  },
}

export const initialWalletsMock = [
  {
    address: walletAddressMock2,
    type: WalletType.EXTERNAL_OTHER,
    metadata: {
      field1: 'field1',
      field2: 'field2',
    },
  },
  walletMock,
  {
    type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
    metadata: {
      field4: 'field4',
    },
  },
]

export const initialEntitiesMock = [
  {
    id: entityMock.id,
    name: entityMock.name,
    metadata: entityMock.metadata,
    initialWallets: initialWalletsMock,
    defaultWallet: walletAddressMock,
  },
  {
    id: uuidv4(),
    name: 'Entity 2',
  },
]

export const storeIdMock = 'test-store-1'
export const storeIdMock2 = 'test-store-2'
export const storeIdMock3 = 'test-store-3'
export const storeIdReal = 'orchestrate-eth-akv'

export const storeMappingsMock = [
  {
    walletType: WalletType.INTERNAL_CLIENT_AWS_VAULT,
    storeId: storeIdMock,
  },
  {
    walletType: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
    storeId: storeIdMock2,
  },
]

export const storeConfigMock = {
  [storeIdMock]: WalletType.INTERNAL_CLIENT_AWS_VAULT,
  [storeIdMock2]: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
}

export const filePathMock = '/test/fake/path.test'
export const clientNameMock = 'TestClient - M2M'
export const clientTypeMock = ClientType.SinglePage
export const clientIdMock = 'S1Rs8UzpQMhU5zssLAMedjNd6V8c6l8A'

export const entityClientCreateRequestMock = {
  type: ClientType.SinglePage,
}

export const permissionMock = 'read_all:tenant'
