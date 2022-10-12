import { group } from 'k6'
import { getK6Config } from '../../utils/config'
import { tenantCreateRequestMock } from '../../utils/mocks'
import { createTenant } from '../../utils/endpoints'
import { createUserToken } from '../../utils/auth'

interface Params {
  authToken: string
}

export const options = getK6Config('CreateTenantEndpoint')

export function setup(): Params {
  const authToken = createUserToken()
  return { authToken }
}

export default function (params: Params) {
  group('Create Tenant', function () {
    createTenant(tenantCreateRequestMock(), params.authToken)
  })
}
