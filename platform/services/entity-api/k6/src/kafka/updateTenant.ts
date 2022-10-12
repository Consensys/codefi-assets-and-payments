import { group } from 'k6'
import { getK6Config } from '../../utils/config'
import {
  tenantCreateRequestMock,
  tenantUpdateCommandMock,
} from '../../utils/mocks'
import {
  createTenantOperationConsumers,
  waitForTenantOperationMessage,
  createTenantUpdateProducer,
  updateTenantCommand,
} from '../../utils/commands'
import { createUserToken } from '../../utils/auth'
import { createTenants, getTenantId } from '../../utils/endpoints'

interface Params {
  authToken: string
  tenantIds: string[]
}

export const options = getK6Config('UpdateTenantKafka')

const producer = createTenantUpdateProducer()
const consumers = createTenantOperationConsumers()

export function setup(): Params {
  const authToken = createUserToken()
  const { ids: tenantIds } = createTenants(tenantCreateRequestMock, authToken)
  return { authToken, tenantIds }
}

export default function (params: Params) {
  group('Update Tenant', function () {
    const tenantId = getTenantId(params.tenantIds)
    const payload = tenantUpdateCommandMock(tenantId)
    updateTenantCommand(producer, payload)
    waitForTenantOperationMessage(consumers, tenantId, 'UPDATE')
  })
}

export function teardown() {
  producer.close()
  consumers.close()
}
