import { group } from 'k6'
import { createEntity, createTenant, createWallet } from '../../utils/endpoints'
import { createUserToken } from '../../utils/auth'
import { getK6Config } from '../../utils/config'
import {
  entityCreateRequestMock,
  tenantCreateRequestMock,
  walletCreateRequestMock,
  walletUpdateCommandMock,
} from '../../utils/mocks'
import {
  createWalletOperationConsumers,
  createWalletUpdateProducer,
  updateWalletCommand,
  waitForWalletOperationMessage,
} from '../../utils/commands'

interface Params {
  authToken: string
  tenantId: string
  entityId: string
  walletAddress: string
}

const producer = createWalletUpdateProducer()
const consumers = createWalletOperationConsumers()

export const options = getK6Config('UpdateWalletKafka')

export function setup(): Params {
  const authToken = createUserToken()
  const { id: tenantId } = createTenant(tenantCreateRequestMock(), authToken)

  const { id: entityId } = createEntity(
    tenantId,
    entityCreateRequestMock(),
    authToken,
  )

  const { address: walletAddress } = createWallet(
    tenantId,
    entityId,
    walletCreateRequestMock,
    authToken,
  )

  return { authToken, tenantId, entityId, walletAddress }
}

export default function (params: Params) {
  group('Update Wallet', function () {
    const payload = walletUpdateCommandMock(
      params.tenantId,
      params.entityId,
      params.walletAddress,
    )

    updateWalletCommand(producer, payload)
    waitForWalletOperationMessage(
      consumers,
      'UPDATE',
      (messageData) => messageData.address === payload.address,
    )
  })
}

export function teardown() {
  producer.close()
  consumers.close()
}
