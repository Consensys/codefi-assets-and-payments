const { onExecutePostLogin: action } = require('./tenantIdCustomClaim')
const { runAction: baseRunAction } = require('./test/utils')

describe('Action - Tenant ID Custom Claim', () => {
  const PRODUCT_PAYMENTS = 'payments'
  const PRODUCT_ASSETS = 'assets'
  const PRODUCT_COMPLIANCE = 'compliance'
  const TOKEN_ID = 'idToken'
  const TOKEN_ACCESS = 'accessToken'
  const NAMESPACE_CUSTOM = 'TestCustomNamespace'
  const NAMESPACE_ORCHESTRATE = 'TestOrchestrateNamespace'

  const tenantIdMock1 = 'TestTenantId1'
  const tenantIdMock2 = 'TestTenantId2'
  const entityIdMock1 = 'TestEntityId1'
  const entityIdMock2 = 'TestEntityId2'
  const entityIdMock3 = 'TestEntityId3'
  const subTenantIdMock = 'TestSubTenantId1'
  const roleMock1 = 'TestRole1'
  const roleMock2 = 'TestRole2'
  const roleMock3 = 'TestRole3'
  const permissionMock1 = 'TestPermission1'
  const permissionMock2 = 'TestPermission2'
  const permissionMock3 = 'TestPermission3'
  const permissionMock4 = 'TestPermission4'
  const permissionMock5 = 'TestPermission5'

  const clientNoProductMock = {
    metadata: {
      tenantId: tenantIdMock1,
      assets: 'false',
      compliance: 'false',
      payments: 'false',
    },
  }

  const createClient = (product, template = clientNoProductMock) => {
    const products = [PRODUCT_PAYMENTS, PRODUCT_ASSETS, PRODUCT_COMPLIANCE]
    const remaining = products.filter(
      currentProduct => currentProduct !== product,
    )
    return {
      ...template,
      metadata: {
        ...template.metadata,
        [product]: 'true',
        [remaining[0]]: 'false',
        [remaining[1]]: 'false',
      },
    }
  }

  const clientMock = createClient(PRODUCT_ASSETS)

  const clientWithEntityIdMock = {
    ...clientMock,
    metadata: {
      ...clientMock.metadata,
      entityId: entityIdMock3,
      payments: 'true',
    },
  }

  const clientWithSubTenantMock = {
    ...clientMock,
    metadata: {
      ...clientMock.metadata,
      subTenantId: subTenantIdMock,
    },
  }

  const clientEmptyMock = {
    ...clientMock,
    metadata: {
      payments: 'true',
    },
  }

  const userLegacyMock = {
    app_metadata: {
      tenantId: tenantIdMock2,
    },
  }

  const userMock = {
    app_metadata: {
      [tenantIdMock1]: {
        entityId: entityIdMock1,
        roles: [roleMock1, roleMock2],
      },
      [`${tenantIdMock1}:${subTenantIdMock}`]: {
        entityId: entityIdMock2,
      },
    },
  }

  const userEmptyMock = {
    app_metadata: {},
  }

  const rolesMock = {
    allPermissions: [
      permissionMock1,
      permissionMock2,
      permissionMock3,
      permissionMock4,
      permissionMock5,
    ],
    roles: {
      [roleMock1]: [0, 1],
      [roleMock2]: [2],
      [roleMock3]: [0, 3, 4],
    },
    orchestrate: [0, 3, 4],
  }

  const runAction = async (user, client, other = {}) => {
    return await baseRunAction(action, {
      user,
      client,
      secrets: {
        CUSTOM_NAMESPACE: NAMESPACE_CUSTOM,
        CUSTOM_ORCHESTRATE_NAMESPACE: NAMESPACE_ORCHESTRATE,
      },
      consensysMocks: { roles: JSON.stringify(rolesMock) },
      ...other,
    })
  }

  describe('Custom Namespace', () => {
    describe('Tenant ID', () => {
      it.each([
        [TOKEN_ID, PRODUCT_PAYMENTS],
        [TOKEN_ID, PRODUCT_ASSETS],
        [TOKEN_ID, PRODUCT_COMPLIANCE],
        [TOKEN_ACCESS, PRODUCT_PAYMENTS],
        [TOKEN_ACCESS, PRODUCT_ASSETS],
        [TOKEN_ACCESS, PRODUCT_COMPLIANCE],
      ])(
        'sets in %s using client metadata if client is %s',
        async (tokenType, product) => {
          const api = await runAction(userMock, createClient(product))
          expect(api[tokenType].setCustomClaim).toHaveBeenCalledWith(
            NAMESPACE_CUSTOM,
            {
              tenantId: tenantIdMock1,
            },
          )
        },
      )

      it.each([TOKEN_ID, TOKEN_ACCESS])(
        'sets in %s using user metadata if not in client metadata',
        async tokenType => {
          const api = await runAction(userLegacyMock, clientEmptyMock)
          expect(api[tokenType].setCustomClaim).toHaveBeenCalledWith(
            NAMESPACE_CUSTOM,
            {
              tenantId: tenantIdMock2,
            },
          )
        },
      )

      it.each([TOKEN_ID, TOKEN_ACCESS])(
        'does not create custom namespace if client not payments, assets, or compliance',
        async tokenType => {
          const api = await runAction(userMock, clientNoProductMock)
          expect(api[tokenType].setCustomClaim).not.toHaveBeenCalled()
        },
      )

      it.each([TOKEN_ID, TOKEN_ACCESS])(
        'does not create custom namespace if not in client or user metadata',
        async tokenType => {
          const api = await runAction(
            userMock,
            createClient('payments', clientEmptyMock),
          )
          expect(api[tokenType].setCustomClaim).not.toHaveBeenCalled()
        },
      )
    })
  })

  describe('Entity ID', () => {
    it.each([TOKEN_ID, TOKEN_ACCESS])(
      'sets in %s using mapping in user metadata',
      async tokenType => {
        const api = await runAction(userMock, clientMock)
        expect(api[tokenType].setCustomClaim).toHaveBeenCalledWith(
          NAMESPACE_CUSTOM,
          expect.objectContaining({
            entityId: entityIdMock1,
          }),
        )
      },
    )

    it.each([TOKEN_ID, TOKEN_ACCESS])(
      'sets in %s using sub tenant id in client metadata',
      async tokenType => {
        const api = await runAction(userMock, clientWithSubTenantMock)
        expect(api[tokenType].setCustomClaim).toHaveBeenCalledWith(
          NAMESPACE_CUSTOM,
          expect.objectContaining({
            entityId: entityIdMock2,
          }),
        )
      },
    )

    it.each([TOKEN_ID, TOKEN_ACCESS])(
      'sets in %s using client metadata if no mapping in user metadata and client is payments',
      async tokenType => {
        const api = await runAction(userEmptyMock, clientWithEntityIdMock)
        expect(api[tokenType].setCustomClaim).toHaveBeenCalledWith(
          NAMESPACE_CUSTOM,
          expect.objectContaining({
            entityId: entityIdMock3,
          }),
        )
      },
    )

    it.each([TOKEN_ID, TOKEN_ACCESS])(
      'does not set in %s using client metadata if client not payments',
      async tokenType => {
        const api = await runAction(
          userEmptyMock,
          createClient('assets', clientWithEntityIdMock),
        )
        expect(api[tokenType].setCustomClaim).not.toHaveBeenCalledWith(
          NAMESPACE_CUSTOM,
          expect.objectContaining({ entityId: expect.any(String) }),
        )
      },
    )

    it.each([TOKEN_ID, TOKEN_ACCESS])(
      'does not set if not in client or user metadata',
      async tokenType => {
        const api = await runAction(userEmptyMock, clientMock)
        expect(api[tokenType].setCustomClaim).not.toHaveBeenCalledWith(
          NAMESPACE_CUSTOM,
          expect.objectContaining({ entityId: expect.any(String) }),
        )
      },
    )
  })

  describe('Orchestrate Namespace', () => {
    it.each([
      [TOKEN_ID, 'payments'],
      [TOKEN_ID, 'assets'],
      [TOKEN_ID, 'compliance'],
      [TOKEN_ACCESS, 'payments'],
      [TOKEN_ACCESS, 'assets'],
      [TOKEN_ACCESS, 'compliance'],
    ])('sets tenant id in %s if client is %s', async (tokenType, product) => {
      const api = await runAction(userMock, createClient(product))
      const expectedTenantId = `${tenantIdMock1}:${entityIdMock1}`
      expect(api[tokenType].setCustomClaim).toHaveBeenCalledWith(
        NAMESPACE_ORCHESTRATE,
        {
          tenant_id: expectedTenantId,
        },
      )
    })

    it.each([TOKEN_ID, TOKEN_ACCESS])(
      'sets tenant id in %s using sub tenant id in client metadata',
      async tokenType => {
        const api = await runAction(userMock, clientWithSubTenantMock)
        const expectedTenantId = `${tenantIdMock1}:${entityIdMock2}`
        expect(api[tokenType].setCustomClaim).toHaveBeenCalledWith(
          NAMESPACE_ORCHESTRATE,
          {
            tenant_id: expectedTenantId,
          },
        )
      },
    )

    it.each([TOKEN_ID, TOKEN_ACCESS])(
      'sets tenant id in %s using entity id from client metadata if no user mapping and client is payments',
      async tokenType => {
        const api = await runAction(userEmptyMock, clientWithEntityIdMock)
        const expectedTenantId = `${tenantIdMock1}:${entityIdMock3}`
        expect(api[tokenType].setCustomClaim).toHaveBeenCalledWith(
          NAMESPACE_ORCHESTRATE,
          {
            tenant_id: expectedTenantId,
          },
        )
      },
    )

    it.each([TOKEN_ID, TOKEN_ACCESS])(
      'does not create orchestrate namespace in %s using entity id from client metadata if client not payments',
      async tokenType => {
        const api = await runAction(
          userEmptyMock,
          createClient('assets', clientWithEntityIdMock),
        )
        expect(api[tokenType].setCustomClaim).not.toHaveBeenCalledWith(
          NAMESPACE_ORCHESTRATE,
          expect.any(Object),
        )
      },
    )

    it.each([TOKEN_ID, TOKEN_ACCESS])(
      'does not create orchestrate namespace in %s if no tenant id',
      async tokenType => {
        const api = await runAction(userMock, clientEmptyMock)
        expect(api[tokenType].setCustomClaim).not.toHaveBeenCalledWith(
          NAMESPACE_ORCHESTRATE,
          expect.any(Object),
        )
      },
    )

    it.each([TOKEN_ID, TOKEN_ACCESS])(
      'does not create orchestrate namespace in %s if client not payments, assets, or compliance',
      async tokenType => {
        const api = await runAction(userMock, clientNoProductMock)
        expect(api[tokenType].setCustomClaim).not.toHaveBeenCalledWith(
          NAMESPACE_ORCHESTRATE,
          expect.any(Object),
        )
      },
    )

    it.each([TOKEN_ID, TOKEN_ACCESS])(
      'does not create orchestrate namespace in %s if tenant id and no entity id',
      async tokenType => {
        const api = await runAction(userEmptyMock, clientMock)
        expect(api[tokenType].setCustomClaim).not.toHaveBeenCalledWith(
          NAMESPACE_ORCHESTRATE,
          expect.any(Object),
        )
      },
    )
  })

  describe('Roles', () => {
    it('sets permissions according to roles in user metadata', async () => {
      const api = await runAction(userMock, clientMock)

      expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
        NAMESPACE_CUSTOM,
        expect.objectContaining({
          permissions: [permissionMock2, permissionMock3],
        }),
      )

      expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
        NAMESPACE_ORCHESTRATE,
        expect.objectContaining({
          permissions: [permissionMock1],
        }),
      )
    })

    it('ignores duplicate permissions in alternate roles', async () => {
      const user = {
        ...userMock,
        app_metadata: {
          ...userMock.app_metadata,
          [tenantIdMock1]: {
            ...userMock[tenantIdMock1],
            roles: [roleMock1, roleMock2, roleMock3],
          },
        },
      }

      const api = await runAction(user, clientMock)

      expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
        NAMESPACE_CUSTOM,
        expect.objectContaining({
          permissions: [permissionMock2, permissionMock3],
        }),
      )

      expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
        NAMESPACE_ORCHESTRATE,
        expect.objectContaining({
          permissions: [permissionMock1, permissionMock4, permissionMock5],
        }),
      )
    })

    it('ignores unrecognised roles', async () => {
      const user = {
        ...userMock,
        app_metadata: {
          ...userMock.app_metadata,
          [tenantIdMock1]: {
            ...userMock[tenantIdMock1],
            roles: [roleMock1, roleMock2, 'invalidRole'],
          },
        },
      }

      const api = await runAction(user, clientMock)

      expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
        NAMESPACE_CUSTOM,
        expect.objectContaining({
          permissions: [permissionMock2, permissionMock3],
        }),
      )

      expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
        NAMESPACE_ORCHESTRATE,
        expect.objectContaining({
          permissions: [permissionMock1],
        }),
      )
    })

    it('sets permissions using all user roles if no tenant roles in user metadata', async () => {
      const user = {
        ...userMock,
        app_metadata: {
          ...userMock.app_metadata,
          [tenantIdMock1]: {
            ...userMock[tenantIdMock1],
            roles: undefined,
          },
        },
      }

      const api = await runAction(user, clientMock, {
        authorization: { roles: [roleMock1, roleMock2] },
      })

      expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
        NAMESPACE_CUSTOM,
        expect.objectContaining({
          permissions: [permissionMock2, permissionMock3],
        }),
      )

      expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
        NAMESPACE_ORCHESTRATE,
        expect.objectContaining({
          permissions: [permissionMock1],
        }),
      )
    })

    it('sets empty permissions if tenant roles is empty array', async () => {
      const user = {
        ...userMock,
        app_metadata: {
          ...userMock.app_metadata,
          [tenantIdMock1]: {
            ...userMock[tenantIdMock1],
            roles: [],
          },
        },
      }

      const api = await runAction(user, clientMock, {
        authorization: { roles: [roleMock1, roleMock2] },
      })

      expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
        NAMESPACE_CUSTOM,
        expect.objectContaining({
          permissions: [],
        }),
      )

      expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
        NAMESPACE_ORCHESTRATE,
        expect.objectContaining({
          permissions: [],
        }),
      )
    })

    it('sets empty permissions if no tenant roles and no Auth0 roles', async () => {
      const user = {
        ...userMock,
        app_metadata: {
          ...userMock.app_metadata,
          [tenantIdMock1]: {
            ...userMock[tenantIdMock1],
            roles: undefined,
          },
        },
      }

      const api = await runAction(user, clientMock)

      expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
        NAMESPACE_CUSTOM,
        expect.objectContaining({
          permissions: [],
        }),
      )

      expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(
        NAMESPACE_ORCHESTRATE,
        expect.objectContaining({
          permissions: [],
        }),
      )
    })
  })
})
