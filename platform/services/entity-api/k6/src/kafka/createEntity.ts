import { group } from 'k6'
import { createEntity, createTenants, getTenantId } from '../../utils/endpoints'
import { createUserToken } from '../../utils/auth'
import { getK6Config } from '../../utils/config'
import {
  entityCreateCommandMock,
  entityCreateRequestMock,
  tenantCreateRequestMock,
} from '../../utils/mocks'
import {
  createEntityCommand,
  createEntityCreateProducer,
  createEntityOperationConsumers,
  waitForEntityOperationMessage,
} from '../../utils/commands'

interface Params {
  authToken: string
  tenantIds: string[]
}

export const options = getK6Config('CreateEntityKafka')

const producer = createEntityCreateProducer()
const consumers = createEntityOperationConsumers()

export function setup(): Params {
  const authToken = createUserToken()
  const { ids: tenantIds } = createTenants(tenantCreateRequestMock, authToken)
  return { authToken, tenantIds }
}

export default function (params: Params) {
  group('Create Entity', function () {
    const tenantId = getTenantId(params.tenantIds)
    const payload = entityCreateCommandMock(tenantId)

    createEntityCommand(producer, payload)
    waitForEntityOperationMessage(consumers, payload.entityId.string, 'CREATE')
  })
}

export function teardown() {
  producer.close()
  consumers.close()
}
