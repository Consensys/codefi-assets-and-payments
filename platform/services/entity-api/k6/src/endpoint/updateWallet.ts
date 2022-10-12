import { group } from 'k6'
import {
  createEntity,
  createTenant,
  createWallet,
  updateWallet,
} from '../../utils/endpoints'
import { createUserToken } from '../../utils/auth'
import { getK6Config } from '../../utils/config'
import {
  entityCreateRequestMock,
  tenantCreateRequestMock,
  walletCreateRequestMock,
  walletUpdateRequestMock,
} from '../../utils/mocks'

interface Params {
  authToken: string
  tenantId: string
  entityId: string
  walletAddress: string
}

export const options = getK6Config('UpdateWalletEndpoint')

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
    updateWallet(
      params.tenantId,
      params.entityId,
      params.walletAddress,
      walletUpdateRequestMock,
      params.authToken,
    )
  })
}
