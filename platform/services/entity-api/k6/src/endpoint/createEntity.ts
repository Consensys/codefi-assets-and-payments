import { group } from 'k6'
import { createEntity, createTenants, getTenantId } from '../../utils/endpoints'
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

export const options = getK6Config('CreateEntityEndpoint')

export function setup(): Params {
  const authToken = createUserToken()
  const { ids: tenantIds } = createTenants(tenantCreateRequestMock, authToken)
  return { authToken, tenantIds }
}

export default function (params: Params) {
  group('Create Entity', function () {
    const tenantId = getTenantId(params.tenantIds)
    createEntity(tenantId, entityCreateRequestMock(), params.authToken)
  })
}
