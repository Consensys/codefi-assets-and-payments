import { group } from 'k6'
import {
  createEntities,
  createTenants,
  createWallet,
  getEntityId,
  getTenantId,
} from '../../utils/endpoints'
import { createUserToken } from '../../utils/auth'
import { getK6Config } from '../../utils/config'
import {
  entityCreateRequestMock,
  tenantCreateRequestMock,
  walletCreateRequestMock,
} from '../../utils/mocks'

interface Params {
  authToken: string
  tenantIds: string[]
  entityIds: string[]
}

export const options = getK6Config('CreateWalletEndpoint')

export function setup(): Params {
  const authToken = createUserToken()
  const { ids: tenantIds } = createTenants(tenantCreateRequestMock, authToken)

  const { ids: entityIds } = createEntities(
    tenantIds,
    entityCreateRequestMock,
    authToken,
  )

  return { authToken, tenantIds, entityIds }
}

export default function (params: Params) {
  group('Create Wallet', function () {
    const tenantId = getTenantId(params.tenantIds)
    const entityId = getEntityId(params.entityIds)

    createWallet(tenantId, entityId, walletCreateRequestMock, params.authToken)
  })
}
