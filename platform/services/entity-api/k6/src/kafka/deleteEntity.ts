import { group } from 'k6'
import { createEntity, createTenants, getTenantId } from '../../utils/endpoints'
import { createUserToken } from '../../utils/auth'
import { getK6Config } from '../../utils/config'
import {
  entityCreateRequestMock,
  entityDeleteCommandMock,
  tenantCreateRequestMock,
} from '../../utils/mocks'
import {
  createEntityDeleteProducer,
  createEntityOperationConsumers,
  deleteEntityCommand,
  waitForEntityOperationMessage,
} from '../../utils/commands'

interface Params {
  authToken: string
  tenantIds: string[]
}

export const options = getK6Config('DeleteEntityKafka')

const producer = createEntityDeleteProducer()
const consumers = createEntityOperationConsumers()

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
    const payload = entityDeleteCommandMock(tenantId, entityId)

    createEntity(tenantId, createRequest, authToken)
    deleteEntityCommand(producer, payload)
    waitForEntityOperationMessage(consumers, payload.entityId, 'DELETE')
  })
}

export function teardown() {
  producer.close()
  consumers.close()
}
