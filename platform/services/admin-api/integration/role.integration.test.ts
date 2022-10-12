import { createTokenWithoutPermissions, createTokenWithPermissions } from "./utils/jwt";
import { postRole, postAssignPermissionsToRole, apiPost, getRole, getAssignedPermissionsToRole, deletePermissionsToRole } from "./utils/requests";
import { validCreateRoleRequest, validCreateApiRequest } from "../test/mocks";
import { deleteRoles, deleteApi, getAuth0ManagementClient } from "./utils/cleanups";
import { CreateApiRequest } from "../src/requests/ResourceServerApiRequest";
import { sleep } from "../src/utils/sleep";
import { generateRandomText } from "./utils/randomGenerator";
import { ManagementClient } from "auth0";

const roleIds = []
const apis: CreateApiRequest[] = []

jest.setTimeout(600000)

describe('Roles', () => {
  let auth0Client: ManagementClient

  beforeAll(async () => {
    auth0Client = await getAuth0ManagementClient()
  })

  it('should create roles', async () => {
    const token = await createTokenWithPermissions()
    const roleRequest = { ...validCreateRoleRequest, name: generateRandomText(10, 'role') }
    const response = await postRole(roleRequest, token)
    roleIds.push(response.data.id)
    expect(response.data.id).toBeDefined()
    expect(response.data.description).toBe(validCreateRoleRequest.description)
    expect(response.data.name).toBe(roleRequest.name)
  })

  it('cannot create roles without permission', async () => {
    const invalidToken = await createTokenWithoutPermissions()
    try {
      const response = await postRole(
        {
          ...validCreateRoleRequest,
          name: generateRandomText(10, 'role'),
        }, invalidToken,
      )
      fail('should not reach this line')
      roleIds.push(response.data.id)
    } catch (error) {
      expect(error.response.status).toBe(403)
    }
  })

  it('can assign permissions to role', async () => {
    const token = await createTokenWithPermissions()
    // 1) create new api
    const apiReq: CreateApiRequest = validCreateApiRequest('role')
    const apiCreatedResponse = await apiPost(apiReq, token)
    apis.push(apiReq)
    // 2) create role
    const response = await postRole({
      ...validCreateRoleRequest,
      name: generateRandomText(10, 'role')
    }, token)
    roleIds.push(response.data.id)

    // act
    await postAssignPermissionsToRole(response.data.id, [{
      permissionName: apiReq.scopes[0].value,
      resourceServerIdentifier: apiCreatedResponse.data.identifier
    }], token)

    // assert
    // hacky as fuck but auth0 doesn't seem to immediately apply the permissions to a newly created role
    await sleep(1000)
    const permissionsResponse = await getAssignedPermissionsToRole(response.data.id, token)
    expect(permissionsResponse.data.length).toBe(1)
    expect(permissionsResponse.data[0].description).toBe(apiReq.scopes[0].description)
    expect(permissionsResponse.data[0].permissionName).toBe(apiReq.scopes[0].value)
    expect(permissionsResponse.data[0].resourceServerIdentifier).toBe(apiReq.identifier)
    expect(permissionsResponse.data[0].resourceServerName).toBe(apiReq.name)
  })

  it('can remove permissions to role', async () => {
    const token = await createTokenWithPermissions()
    // 1) create new api
    const apiReq: CreateApiRequest = validCreateApiRequest('role')
    const apiCreatedResponse = await apiPost(apiReq, token)
    apis.push(apiReq)
    // 2) create role
    const response = await postRole({
      ...validCreateRoleRequest,
      name: generateRandomText(10, 'role')
    }, token)
    roleIds.push(response.data.id)

    // 3) assign permissions
    await postAssignPermissionsToRole(response.data.id, [{
      permissionName: apiReq.scopes[0].value,
      resourceServerIdentifier: apiCreatedResponse.data.identifier
    }], token)

    await sleep(1000)
    const permissionsResponsePreRemoval = await getAssignedPermissionsToRole(response.data.id, token)

    // act
    await deletePermissionsToRole(response.data.id, [{
      permissionName: apiReq.scopes[0].value,
      resourceServerIdentifier: apiCreatedResponse.data.identifier
    }], token)

    await sleep(1000)
    const permissionsResponsePostRemoval = await getAssignedPermissionsToRole(response.data.id, token)

    expect(permissionsResponsePreRemoval.data.length).toBe(1)
    expect(permissionsResponsePreRemoval.data[0].description).toBe(apiReq.scopes[0].description)
    expect(permissionsResponsePreRemoval.data[0].permissionName).toBe(apiReq.scopes[0].value)
    expect(permissionsResponsePreRemoval.data[0].resourceServerIdentifier).toBe(apiReq.identifier)
    expect(permissionsResponsePreRemoval.data[0].resourceServerName).toBe(apiReq.name)
    expect(permissionsResponsePostRemoval.data.length).toBe(0)
  })

  it('cannot assign role permissions without enough permissions', async () => {
    const token = await createTokenWithoutPermissions()
    try {
      await postAssignPermissionsToRole('whateva', [{
        permissionName: 'whatever',
        resourceServerIdentifier: 'whateva'
      }], token)
    } catch (error) {
      expect(error.response.status).toBe(403)
    }
  })

  it('cannot delete role permissions without enough permissions', async () => {
    const token = await createTokenWithoutPermissions()
    try {
      await deletePermissionsToRole('whateva', [{
        permissionName: 'whatever',
        resourceServerIdentifier: 'whateva'
      }], token)
    } catch (error) {
      expect(error.response.status).toBe(403)
    }
  })

  it('cannot get role by id without enough permissions', async () => {
    const token = await createTokenWithoutPermissions()
    try {
      await getRole('whateva', token)
    } catch (error) {
      expect(error.response.status).toBe(403)
    }
  })

  it('cannot get role permissions without enough permissions', async () => {
    const token = await createTokenWithoutPermissions()
    try {
      await getAssignedPermissionsToRole('whateva', token)
    } catch (error) {
      expect(error.response.status).toBe(403)
    }
  })

  afterAll(async () => {
    console.log('cleaning up started role')
    console.log(JSON.stringify(apis))
    if (roleIds.length > 0) await deleteRoles(auth0Client, roleIds)
    if (apis.length > 0) await deleteApi(auth0Client, apis)
    console.log('cleaning finished started role')
  })
})
