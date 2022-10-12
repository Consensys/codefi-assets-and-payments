/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  const RAW_ROLES =
    (event.consensysMocks && event.consensysMocks.roles) || '%ROLES%'

  const NAMESPACE_CUSTOM = event.secrets.CUSTOM_NAMESPACE
  const NAMESPACE_ORCHESTRATE = event.secrets.CUSTOM_ORCHESTRATE_NAMESPACE
  const CLAIM_PERMISSIONS = 'permissions'

  const clientMetadata = event.client.metadata || {}
  const userMetadata = event.user.app_metadata || {}
  const isAssets = clientMetadata.assets === 'true'
  const isCompliance = clientMetadata.compliance === 'true'
  const isPayments = clientMetadata.payments === 'true'
  const allUserRoles = (event.authorization || { roles: [] }).roles

  let roles
  let customClaims = {}

  const getTenantId = () => {
    const tenantId = clientMetadata.tenantId
    if (tenantId && (isAssets || isCompliance || isPayments)) return tenantId
    return userMetadata.tenantId
  }

  const getTenantData = tenantId => {
    if (!tenantId) return
    const subTenantId = clientMetadata.subTenantId
    const namespace = subTenantId ? `${tenantId}:${subTenantId}` : tenantId
    return userMetadata[namespace]
  }

  const getEntityId = tenantId => {
    const tenantData = getTenantData(tenantId) || {}
    const userEntityId = tenantData.entityId
    if (userEntityId) return userEntityId

    const clientEntityId = clientMetadata.entityId
    if (isPayments && clientEntityId) return clientEntityId
  }

  const addCustomClaim = (namespace, name, value) => {
    const existingData = customClaims[namespace] || {}

    const newData = {
      ...existingData,
      [name]: value,
    }

    api.accessToken.setCustomClaim(namespace, newData)
    api.idToken.setCustomClaim(namespace, newData)

    customClaims[namespace] = newData
  }

  const getRolePermissions = (role, orchestrateFilter) => {
    if (!roles) {
      roles = JSON.parse(RAW_ROLES)
    }

    const permissionIndexes = roles.roles[role] || []
    const orchestrateIndexes = roles.orchestrate

    const filteredIndexes = permissionIndexes.filter(
      index => orchestrateIndexes.includes(index) === orchestrateFilter,
    )

    return filteredIndexes.map(
      permissionIndex => roles.allPermissions[permissionIndex],
    )
  }

  const getUniqueRolePermissions = (roles, orchestrateFilter) => {
    return [
      ...new Set(
        [].concat(
          ...roles.map(role => getRolePermissions(role, orchestrateFilter)),
        ),
      ),
    ]
  }

  const includeTenantAndEntityIds = (tenantId, entityId) => {
    if (tenantId) {
      addCustomClaim(NAMESPACE_CUSTOM, 'tenantId', tenantId)
    }

    if (entityId) {
      addCustomClaim(NAMESPACE_CUSTOM, 'entityId', entityId)
    }

    if (tenantId && entityId) {
      const orchestrateTenantId = `${tenantId}:${entityId}`
      addCustomClaim(NAMESPACE_ORCHESTRATE, 'tenant_id', orchestrateTenantId)
    }
  }

  const updatePermissionsUsingRoles = tenantId => {
    const tenantData = getTenantData(tenantId)
    if (!tenantData) return

    const userRoles = tenantData.roles || allUserRoles
    const codefiPermissions = getUniqueRolePermissions(userRoles, false)
    const orchestratePermissions = getUniqueRolePermissions(userRoles, true)

    addCustomClaim(NAMESPACE_CUSTOM, CLAIM_PERMISSIONS, codefiPermissions)

    addCustomClaim(
      NAMESPACE_ORCHESTRATE,
      CLAIM_PERMISSIONS,
      orchestratePermissions,
    )
  }

  const tenantId = getTenantId()
  const entityId = getEntityId(tenantId)

  includeTenantAndEntityIds(tenantId, entityId)
  updatePermissionsUsingRoles(tenantId)
}
