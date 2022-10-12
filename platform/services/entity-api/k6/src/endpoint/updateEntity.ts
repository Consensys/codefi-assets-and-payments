import { group } from 'k6'
import {
  createEntities,
  createTenants,
  getEntityId,
  getTenantId,
  updateEntity,
} from '../../utils/endpoints'
import { createUserToken } from '../../utils/auth'
import { getK6Config } from '../../utils/config'
import {
  entityCreateRequestMock,
  entityUpdateRequestMock,
  tenantCreateRequestMock,
} from '../../utils/mocks'

interface Params {
  authToken: string
  tenantIds: string[]
  entityIds: string[]
  defaultWallets: string[]
}

export const options = getK6Config('UpdateEntityEndpoint')

export function setup(): Params {
  const authToken = createUserToken()
  const { ids: tenantIds } = createTenants(tenantCreateRequestMock, authToken)

  const { ids: entityIds, responses: entities } = createEntities(
    tenantIds,
    entityCreateRequestMock,
    authToken,
  )

  const defaultWallets = entities.map((entity) => entity.defaultWallet)

  return { authToken, tenantIds, entityIds, defaultWallets }
}

export default function (params: Params) {
  group('Update Entity', function () {
    const tenantId = getTenantId(params.tenantIds)
    const entityId = getEntityId(params.entityIds)
    const defaultWallet = getEntityId(params.defaultWallets)

    updateEntity(
      tenantId,
      entityId,
      { ...entityUpdateRequestMock(), defaultWallet },
      params.authToken,
    )
  })
}
