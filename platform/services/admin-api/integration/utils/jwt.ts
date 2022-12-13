import { M2mTokenModule, M2mTokenService } from '@consensys/auth'
import { Test } from '@nestjs/testing'
import { ConfigConstants } from '../../src/config/ConfigConstants'
import { ManagementClientExtended } from '../../src/types/Auth0ManagementClientExtended'
import { getAllClients } from '../../src/utils/managementClientUtils'
import { getAuth0ManagementClient } from './cleanups'
import {
  AUTH0_DEV_BASE_URL,
  DEV_ADMIN_AUDIENCE,
  DEV_API_DEV_AUDIENCE,
  DEV_MAIN_CLIENT_ID,
  DEV_MAIN_CLIENT_SECRET,
} from './configs'
import { RequestMethod, runRequest } from './httpRequest'

export const getM2MAccessToken = async ({
  clientName = ConfigConstants.MACHINE_TO_MACHINE_CLIENT_NAME_ADMIN,
  audience = DEV_ADMIN_AUDIENCE,
} = {}): Promise<string> => {
  const managementClient = await getAuth0ManagementClient()

  const clients = await getAllClients(
    managementClient as ManagementClientExtended,
  )

  const m2mClient = clients.find((client) => client.name === clientName)

  if (!m2mClient) throw new Error('Cannot find M2M client')

  return await getAccessToken({
    clientId: m2mClient.client_id,
    clientSecret: m2mClient.client_secret,
    audience,
  })
}

export const getAccessToken = async ({
  clientId = DEV_MAIN_CLIENT_ID,
  clientSecret = DEV_MAIN_CLIENT_SECRET,
  audience = DEV_ADMIN_AUDIENCE,
  useCache = true,
}: {
  clientId?: string
  clientSecret?: string
  audience?: string
  useCache?: boolean
} = {}) => {
  if (useCache) {
    const testModule = await Test.createTestingModule({
      imports: [M2mTokenModule],
    }).compile()

    const m2mTokenService = testModule.get(M2mTokenService)

    return await m2mTokenService.createM2mToken(
      clientId,
      clientSecret,
      audience,
    )
  }

  const payload = {
    grant_type: 'client_credentials',
    audience,
    client_id: clientId,
    client_secret: clientSecret,
  }

  const response = await runRequest(
    `${AUTH0_DEV_BASE_URL}/oauth/token`,
    RequestMethod.POST,
    undefined,
    payload,
  )

  return response.data.access_token
}

export const createTokenWithPermissions = async () => getM2MAccessToken()

export const createTokenWithoutPermissions = async () =>
  getM2MAccessToken({
    clientName: ConfigConstants.MACHINE_TO_MACHINE_CLIENT_NAME_CODEFI,
    audience: DEV_API_DEV_AUDIENCE,
  })
