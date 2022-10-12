import { group } from 'k6'
import {
  createEntity,
  createTenants,
  deleteEntity,
  getTenantId,
} from '../../utils/endpoints'
import { createUserToken } from '../../utils/auth'
import { getK6Config } from '../../utils/config'
import {
  entityCreateRequestMock,
  tenantCreateRequestMock,
} from '../../utils/mocks'

interface Params {
  authToken: string
  tenantIds: string[]
}

export const options = getK6Config('DeleteEntityEndpoint')

export function setup(): Params {
  const authToken = createUserToken()
  const { ids: tenantIds } = createTenants(tenantCreateRequestMock, authToken)
  return { authToken, tenantIds }
}

export default function (params: Params) {
  group('Delete Entity', function () {
    const tenantId = getTenantId(params.tenantIds)
    const createRequest = entityCreateRequestMock()
    const entityId = createRequest.id
    const authToken = params.authToken

    createEntity(tenantId, createRequest, authToken)
    deleteEntity(tenantId, entityId, authToken)
  })
}
