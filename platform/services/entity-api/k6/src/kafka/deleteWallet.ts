import { group } from 'k6'
import {
  createEntities,
  createTenants,
  createWallet,
  getEntityId,
  getTenantId,
} from '../../utils/endpoints'
import { createUserToken } from '../../utils/auth'
import { getK6Config } from '../../utils/config'
import {
  entityCreateRequestMock,
  tenantCreateRequestMock,
  walletCreateRequestMock,
  walletDeleteCommandMock,
} from '../../utils/mocks'
import {
  createWalletDeleteProducer,
  createWalletOperationConsumers,
  deleteWalletCommand,
  waitForWalletOperationMessage,
} from '../../utils/commands'

interface Params {
  authToken: string
  tenantIds: string[]
  entityIds: string[]
}

export const options = getK6Config('DeleteWalletKafka')

const producer = createWalletDeleteProducer()
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
  group('Delete Wallet', function () {
    const tenantId = getTenantId(params.tenantIds)
    const entityId = getEntityId(params.entityIds)
    const authToken = params.authToken

    const { address } = createWallet(
      tenantId,
      entityId,
      walletCreateRequestMock,
      authToken,
    )

    const payload = walletDeleteCommandMock(tenantId, entityId, address)

    deleteWalletCommand(producer, payload)
    waitForWalletOperationMessage(
      consumers,
      'DELETE',
      (message) => message.address === address,
    )
  })
}

export function teardown() {
  producer.close()
  consumers.close()
}
