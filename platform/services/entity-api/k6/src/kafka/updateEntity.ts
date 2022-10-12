import { group } from 'k6'
import {
  createEntities,
  createTenants,
  getEntityId,
  getTenantId,
} from '../../utils/endpoints'
import { createUserToken } from '../../utils/auth'
import { getK6Config } from '../../utils/config'
import {
  entityCreateRequestMock,
  entityUpdateCommandMock,
  tenantCreateRequestMock,
} from '../../utils/mocks'
import {
  createEntityOperationConsumers,
  createEntityUpdateProducer,
  updateEntityCommand,
  waitForEntityOperationMessage,
} from '../../utils/commands'

interface Params {
  authToken: string
  tenantIds: string[]
  entityIds: string[]
  defaultWallets: string[]
}

const producer = createEntityUpdateProducer()
const consumers = createEntityOperationConsumers()

export const options = getK6Config('UpdateEntityKafka')

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
    const payload = entityUpdateCommandMock(tenantId, entityId, defaultWallet)

    updateEntityCommand(producer, payload)
    waitForEntityOperationMessage(consumers, payload.entityId, 'UPDATE')
  })
}

export function teardown() {
  producer.close()
  consumers.close()
}
