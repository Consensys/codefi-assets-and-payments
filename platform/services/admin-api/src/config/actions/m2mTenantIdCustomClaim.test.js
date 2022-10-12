const { JsonWebTokenError } = require('jsonwebtoken')
const {
  onExecuteCredentialsExchange: action,
} = require('./m2mTenantIdCustomClaim')

const { runAction: baseRunAction } = require('./test/utils')

describe('Action - M2M Tenant ID Custom Claim', () => {
  const secretsMock = {
    CUSTOM_NAMESPACE: 'TestNamespace1',
    CUSTOM_ORCHESTRATE_NAMESPACE: 'TestNamespace2',
    MULTI_TENANT_CLIENT_NAME: 'TestMultiTenant',
  }

  const tenantIdMock = 'testTenantId'
  const entityIdMock = 'testEntityId'
  const scopeMock = ['permission1', 'permission2', 'permission3', 'permission4']
  const orchestratePermissionsMock = ['permission1', 'permission3']
  const codefiPermissionsMock = ['permission2', 'permission4']

  const runAction = event => {
    return baseRunAction(action, {
      ...event,
      consensysMocks: {
        permissions: JSON.stringify({
          allPermissions: scopeMock,
          orchestrate: [0, 2],
        }),
      },
    })
  }

  it('creates codefi custom claim with tenant id only', async () => {
    const api = await runAction({
      client: { metadata: { tenantId: tenantIdMock } },
      secrets: secretsMock,
      accessToken: { scope: scopeMock },
    })

    expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
      secretsMock.CUSTOM_NAMESPACE,
      {
        tenantId: tenantIdMock,
        permissions: codefiPermissionsMock,
      },
    )
  })

  it('creates codefi custom claim with entity id only', async () => {
    const api = await runAction({
      client: { metadata: { entityId: entityIdMock } },
      secrets: secretsMock,
      accessToken: { scope: scopeMock },
    })

    expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
      secretsMock.CUSTOM_NAMESPACE,
      {
        entityId: entityIdMock,
        permissions: codefiPermissionsMock,
      },
    )
  })

  it('creates codefi custom claim with tenant id and entity id', async () => {
    const api = await runAction({
      client: { metadata: { tenantId: tenantIdMock, entityId: entityIdMock } },
      secrets: secretsMock,
      accessToken: { scope: scopeMock },
    })

    expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
      secretsMock.CUSTOM_NAMESPACE,
      {
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        permissions: codefiPermissionsMock,
      },
    )
  })

  it('creates orchestrate custom claim if client is multi-tenant', async () => {
    const api = await runAction({
      client: {
        name: secretsMock.MULTI_TENANT_CLIENT_NAME,
      },
      secrets: secretsMock,
      accessToken: { scope: scopeMock },
    })

    expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
      secretsMock.CUSTOM_ORCHESTRATE_NAMESPACE,
      {
        tenant_id: '*',
        permissions: orchestratePermissionsMock,
      },
    )
  })

  it('creates orchestrate custom claim if client metadata has tenant id and entity id', async () => {
    const api = await runAction({
      client: { metadata: { tenantId: tenantIdMock, entityId: entityIdMock } },
      secrets: secretsMock,
      accessToken: { scope: scopeMock },
    })

    expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
      secretsMock.CUSTOM_ORCHESTRATE_NAMESPACE,
      {
        tenant_id: `${tenantIdMock}:${entityIdMock}`,
        permissions: orchestratePermissionsMock,
      },
    )
  })

  it('does not create orchestrate custom claim if client metadata has tenant id only', async () => {
    const api = await runAction({
      client: { metadata: { tenantId: tenantIdMock } },
      secrets: secretsMock,
      accessToken: { scope: scopeMock },
    })

    expect(api.accessToken.setCustomClaim).not.toHaveBeenCalledWith(
      secretsMock.CUSTOM_ORCHESTRATE_NAMESPACE,
      expect.any(Object),
    )
  })

  it('does not create orchestrate custom claim if client metadata has entity id only', async () => {
    const api = await runAction({
      client: { metadata: { entityId: entityIdMock } },
      secrets: secretsMock,
      accessToken: { scope: scopeMock },
    })

    expect(api.accessToken.setCustomClaim).not.toHaveBeenCalledWith(
      secretsMock.CUSTOM_ORCHESTRATE_NAMESPACE,
      expect.any(Object),
    )
  })
})
