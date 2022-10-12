import { group } from 'k6'
import { createTenant, deleteTenant } from '../../utils/endpoints'
import { createUserToken } from '../../utils/auth'
import { getK6Config } from '../../utils/config'
import { tenantCreateRequestMock } from '../../utils/mocks'

interface Params {
  authToken: string
}

export const options = getK6Config('DeleteTenantEndpoint')

export function setup(): Params {
  const authToken = createUserToken()
  return { authToken }
}

export default function (params: Params) {
  group('Delete Tenant', function () {
    const createRequest = tenantCreateRequestMock()
    createTenant(createRequest, params.authToken)
    deleteTenant(createRequest.id, params.authToken)
  })
}
