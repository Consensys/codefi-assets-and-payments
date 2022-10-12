import { group } from 'k6'
import { createTenant } from '../../utils/endpoints'
import { createUserToken } from '../../utils/auth'
import { getK6Config } from '../../utils/config'
import {
  tenantCreateRequestMock,
  tenantDeleteCommandMock,
} from '../../utils/mocks'
import {
  createTenantDeleteProducer,
  createTenantOperationConsumers,
  deleteTenantCommand,
  waitForTenantOperationMessage,
} from '../../utils/commands'

interface Params {
  authToken: string
}

export const options = getK6Config('DeleteTenantKafka')

const producer = createTenantDeleteProducer()
const consumers = createTenantOperationConsumers()

export function setup(): Params {
  const authToken = createUserToken()
  return { authToken }
}

export default function (params: Params) {
  group('Delete Tenant', function () {
    const { id: tenantId } = createTenant(
      tenantCreateRequestMock(),
      params.authToken,
    )

    const payload = tenantDeleteCommandMock(tenantId)
    deleteTenantCommand(producer, payload)
    waitForTenantOperationMessage(consumers, payload.tenantId, 'DELETE')
  })
}

export function teardown() {
  producer.close()
  consumers.close()
}
