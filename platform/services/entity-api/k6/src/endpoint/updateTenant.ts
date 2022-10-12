import { group } from 'k6'
import { createTenants, getTenantId, updateTenant } from '../../utils/endpoints'
import { createUserToken } from '../../utils/auth'
import { getK6Config } from '../../utils/config'
import {
  tenantCreateRequestMock,
  tenantUpdateRequestMock,
} from '../../utils/mocks'

interface Params {
  authToken: string
  tenantIds: string[]
}

export const options = getK6Config('UpdateTenantEndpoint')

export function setup(): Params {
  const authToken = createUserToken()
  const { ids: tenantIds } = createTenants(tenantCreateRequestMock, authToken)
  return { authToken, tenantIds }
}

export default function (params: Params) {
  group('Update Tenant', function () {
    const tenantId = getTenantId(params.tenantIds)
    updateTenant(tenantId, tenantUpdateRequestMock(), params.authToken)
  })
}
