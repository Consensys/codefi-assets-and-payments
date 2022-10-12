require('dotenv').config()
import {
  createTokenWithoutPermissions,
  createTokenWithPermissions,
  getM2MAccessToken,
} from './utils/jwt'
import { deleteUsers, getAuth0ManagementClient } from './utils/cleanups'
import {
  userInvite,
  getUser,
  deleteUser,
  userCreate,
  updateUser,
  getUsersByEntity,
} from './utils/requests'
import { InviteUserByEmailRequest } from '../src/requests/InviteUserByEmailRequest'
import { generateRandomNumber } from './utils/randomGenerator'
import { ManagementClient } from 'auth0'
import { CreateUserRequest } from '../src/requests/CreateUserRequest'
import { UpdateUserRequest } from '../src/requests/UpdateUserRequest'
import {
  entityIdMock,
  productMock,
  tenantIdMock,
  tenantRolesMock,
} from '../test/mocks'

jest.setTimeout(600000)
const userIds: string[] = []

describe('create, invite, and retrieve users', () => {
  let auth0Client: ManagementClient

  beforeAll(async () => {
    auth0Client = await getAuth0ManagementClient()
  })

  const createUser = async (
    token: string,
    tenantId = tenantIdMock,
    entityId = entityIdMock,
  ) => {
    const email = `consensys.codefiqa+${generateRandomNumber(7)}@gmail.com`
    const password = `Password00!`

    const userRequest: CreateUserRequest = {
      email: email,
      name: email,
      password: password,
      product: productMock,
      tenantId,
      entityId,
      tenantRoles: tenantRolesMock,
    }

    const response = await userCreate(userRequest, token)

    return { request: userRequest, response }
  }

  const retrieveUsersByEntityTemplate = async (
    tenantIdBase: string,
    entityIdBase: string,
  ) => {
    const auth0Token = await createTokenWithPermissions()
    const m2mToken = await getM2MAccessToken()
    const firstEntityCount = 3
    const secondEntityCount = 4
    const firstEntityUserIds = []
    const secondEntityUserIds = []
    const firstSuffix = '_IT1'
    const secondSuffix = '_IT2'
    const firstTenantId = tenantIdBase + firstSuffix
    const secondTenantId = tenantIdBase + secondSuffix
    const firstEntityId = entityIdBase + firstSuffix
    const secondEntityId = entityIdBase + secondSuffix

    for (let i = 0; i < firstEntityCount; i++) {
      const { response } = await createUser(
        auth0Token,
        firstTenantId,
        firstEntityId,
      )

      firstEntityUserIds.push(response.data.userId)
    }

    for (let i = 0; i < secondEntityCount; i++) {
      const { response } = await createUser(
        auth0Token,
        secondTenantId,
        secondEntityId,
      )

      secondEntityUserIds.push(response.data.userId)
    }

    userIds.push(...firstEntityUserIds, ...secondEntityUserIds)

    const firstResponse = await getUsersByEntity(
      firstTenantId,
      firstEntityId,
      m2mToken,
    )

    const secondResponse = await getUsersByEntity(
      secondTenantId,
      secondEntityId,
      m2mToken,
    )

    expect(firstResponse.data.count).toEqual(firstEntityCount)
    expect(firstResponse.data.items.map((response) => response.userId)).toEqual(
      expect.arrayContaining(firstEntityUserIds),
    )

    expect(secondResponse.data.count).toEqual(secondEntityCount)
    expect(
      secondResponse.data.items.map((response) => response.userId),
    ).toEqual(expect.arrayContaining(secondEntityUserIds))
  }

  it('should be able to invite a user', async () => {
    const email = `consensys.codefiqa+${generateRandomNumber(7)}@gmail.com`
    const password = `Password00!`
    const token = await createTokenWithPermissions()

    const userRequest: InviteUserByEmailRequest = {
      email: email,
      name: email,
      password: password,
      product: productMock,
      tenantId: tenantIdMock,
      entityId: entityIdMock,
      tenantRoles: tenantRolesMock,
    }

    const response = await userInvite(userRequest, token)
    const userId = response.data.userId
    userIds.push(userId)

    expect(response.status).toBe(201)

    const getUserResponse = await getUser(userId, token)
    expect(getUserResponse?.data).toBeDefined()

    const appMetadata = getUserResponse?.data?.appMetadata
    expect(appMetadata.products).toBeDefined()
    expect(appMetadata.products?.[userRequest.product]).toEqual(true)

    const tenantData = appMetadata?.[userRequest.tenantId]
    expect(tenantData).toBeDefined()
    expect(tenantData.entityId).toEqual(userRequest.entityId)
    expect(tenantData.roles).toEqual(userRequest.tenantRoles)
  })

  it('should be able to create a user', async () => {
    const token = await createTokenWithPermissions()
    const { response, request } = await createUser(token)

    const userId = response.data.userId
    userIds.push(userId)

    expect(response.status).toBe(201)

    const getUserResponse = await getUser(userId, token)
    expect(getUserResponse?.data).toBeDefined()

    const appMetadata = getUserResponse?.data?.appMetadata
    expect(appMetadata.products).toBeDefined()
    expect(appMetadata.products?.[request.product]).toEqual(true)

    const tenantData = appMetadata?.[request.tenantId]
    expect(tenantData).toBeDefined()
    expect(tenantData.entityId).toEqual(request.entityId)
    expect(tenantData.roles).toEqual(request.tenantRoles)
  })

  it('update user by id', async () => {
    const email = `consensys.codefiqa+${generateRandomNumber(7)}@gmail.com`
    const token = await createTokenWithPermissions()

    const userRequest: InviteUserByEmailRequest = {
      email: email,
      name: email,
    }

    const response = await userInvite(userRequest, token)
    const userId = response.data.userId
    userIds.push(userId)

    expect(response.status).toBe(201)

    const getUserPreUpdate = await getUser(userId, token)

    expect(getUserPreUpdate?.data).toBeDefined()
    expect(getUserPreUpdate?.data?.appMetadata?.[tenantIdMock]).toBeUndefined()
    expect(getUserPreUpdate?.data?.appMetadata?.products).toBeUndefined()

    const userUpdateRequest: UpdateUserRequest = {
      tenantId: tenantIdMock,
      entityId: entityIdMock,
      product: productMock,
      tenantRoles: tenantRolesMock,
    }

    await updateUser(userUpdateRequest, userId, token)

    const getUserPostUpdate = await getUser(userId, token)
    expect(getUserPostUpdate?.data).toBeDefined()

    const appMetadata = getUserPostUpdate?.data?.appMetadata
    expect(appMetadata.products).toBeDefined()
    expect(appMetadata.products?.[userUpdateRequest.product]).toEqual(true)

    const tenantData = appMetadata?.[userUpdateRequest.tenantId]
    expect(tenantData).toBeDefined()
    expect(tenantData.entityId).toEqual(userUpdateRequest.entityId)
    expect(tenantData.roles).toEqual(userUpdateRequest.tenantRoles)
  })

  it('delete user by id', async () => {
    const email = `consensys.codefiqa+${generateRandomNumber(7)}@gmail.com`
    const token = await createTokenWithPermissions()
    const userRequest: InviteUserByEmailRequest = {
      email: email,
      name: email,
    }
    const response = await userInvite(userRequest, token)
    const userId = response.data.userId
    userIds.push(userId)
    expect(response.status).toBe(201)
    const getUserPreDelete = await getUser(userId, token)
    await deleteUser(userId, token)
    try {
      await getUser(userId, token)
      fail('should not reach this')
    } catch (error) {
      expect(error.response.status).toBe(500)
    }
    expect(getUserPreDelete).toBeDefined()
  })

  it('invite user without permissions - 403', async () => {
    const email = `consensys.codefiqa+${generateRandomNumber(7)}@gmail.com`
    const token = await createTokenWithoutPermissions()
    const userRequest: InviteUserByEmailRequest = {
      email: email,
      name: email,
    }
    try {
      await userInvite(userRequest, token)
      fail('should not reach this')
    } catch (error) {
      expect(error.response.status).toBe(403)
    }
  })

  it('retrieve users by entity', async () => {
    await retrieveUsersByEntityTemplate(tenantIdMock, entityIdMock)
  })

  it('retrieve users by entity with special characters', async () => {
    await retrieveUsersByEntityTemplate(
      'tenant+-&|!(){}[]^"~*?:\\Id1',
      'entity+-&|!(){}[]^"~*?:\\Id1',
    )
  })

  afterAll(async () => {
    if (userIds.length > 0) {
      await deleteUsers(auth0Client, userIds)
    }
  })
})
