import { group } from 'k6'
import {
  createEntities,
  createTenants,
  createWallet,
  deleteWallet,
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

export const options = getK6Config('DeleteWalletEndpoint')

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
  group('Delete Wallet', function () {
    const tenantId = getTenantId(params.tenantIds)
    const entityId = getEntityId(params.entityIds)
    const authToken = params.authToken

    const { address } = createWallet(
      tenantId,
      entityId,
      walletCreateRequestMock,
      authToken,
    )

    deleteWallet(tenantId, entityId, address, authToken)
  })
}
