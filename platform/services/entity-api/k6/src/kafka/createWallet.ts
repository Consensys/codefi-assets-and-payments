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
  tenantCreateRequestMock,
  walletCreateCommandMock,
} from '../../utils/mocks'
import {
  createWalletCommand,
  createWalletCreateProducer,
  createWalletOperationConsumers,
  waitForWalletOperationMessage,
} from '../../utils/commands'

interface Params {
  authToken: string
  tenantIds: string[]
  entityIds: string[]
}

export const options = getK6Config('CreateWalletKafka')

const producer = createWalletCreateProducer()
const consumers = createWalletOperationConsumers()

export function setup(): Params {
  const authToken = createUserToken()
  const { ids: tenantIds } = createTenants(tenantCreateRequestMock, authToken)

  const { ids: entityIds } = createEntities(
    tenantIds,
    entityCreateRequestMock,
    authToken,
  )

  return { authToken, tenantIds, entityIds }
}

export default function (params: Params) {
  group('Create Wallet', function () {
    const tenantId = getTenantId(params.tenantIds)
    const entityId = getEntityId(params.entityIds)
    const payload = walletCreateCommandMock(tenantId, entityId)

    createWalletCommand(producer, payload)
    waitForWalletOperationMessage(
      consumers,
      'CREATE',
      (messageData) => messageData.metadata === payload.metadata.string,
    )
  })
}

export function teardown() {
  producer.close()
  consumers.close()
}
