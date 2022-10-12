import { CreateApiRequest } from '../../src/requests/ResourceServerApiRequest'
import { ManagementClient } from 'auth0'
import { Test } from '@nestjs/testing'
import { LoggerModule } from '@codefi-assets-and-payments/observability'
import cfg from '../../src/config'
import { Auth0Module } from '../../src/modules/Auth0Module'
import { Auth0Service } from '../../src/services/Auth0Service'

export const getAuth0ManagementClient = async (): Promise<ManagementClient> => {
  const testmodule = await Test.createTestingModule({
    imports: [
      LoggerModule.forRoot({
        pinoHttp: {
          level: cfg().core.logLevel,
        },
      }),
      Auth0Module,
    ],
  }).compile()
  const auth0Service: Auth0Service = testmodule.get(Auth0Service)
  return await auth0Service.getManagementClient()
}

export const deleteClient = async (
  client: ManagementClient,
  clientIds: string[],
) => {
  for (const clientId of clientIds) {
    await clientDelete(client, clientId)
  }
}

export const deleteRoles = async (
  client: ManagementClient,
  roleIds: string[],
) => {
  const promises = roleIds.map(
    async (roleId) => await roleDelete(client, roleId),
  )
  await Promise.all(promises)
}

const roleDelete = async (client: ManagementClient, roleId: string) => {
  await client.deleteRole({
    id: roleId,
  })
}

export const deleteUsers = async (
  client: ManagementClient,
  userIds: string[],
) => {
  for (const userId of userIds) {
    await deleteUser(client, userId)
  }
}

const deleteUser = async (client: ManagementClient, userId: string) => {
  await client.deleteUser({
    id: userId,
  })
}

const clientDelete = async (client: ManagementClient, clientId: string) => {
  await client.deleteClient({
    client_id: clientId,
  })
}

export const executeSequentially = async (promiseLikeArray) => {
  let result = Promise.resolve()
  promiseLikeArray.forEach(function (promiseLike) {
    result = result.then(promiseLike)
  })
  return result
}

export const deleteApi = async (
  client: ManagementClient,
  apis: CreateApiRequest[],
) => {
  try {
    const promise = apis.map(async (api) => {
      const tmp = await getAllResourceServers(client)
      const apiId = tmp.filter((r) => r.name === api.name)[0].id
      if (!apiId) throw new Error(`No api found with ${api.name} name`)
      await resourcesServerApiDelete(client, apiId)
    })

    await executeSequentially(promise)
    console.log('finished delete api')
  } catch (e) {
    console.log(e)
  }
}

const getAllResourceServers = async (
  client: ManagementClient,
): Promise<any> => {
  const result = await client.getResourceServers()
  return result
}

const resourcesServerApiDelete = async (
  client: ManagementClient,
  apiId: string,
) => {
  await client.deleteResourceServer({
    id: apiId,
  })
}
