/**
 * Handler that will be called during the execution of a Client Credentials exchange.
 *
 * @param {Event} event - Details about client credentials grant request.
 * @param {CredentialsExchangeAPI} api - Interface whose methods can be used to change the behavior of client credentials grant.
 */
exports.onExecuteCredentialsExchange = async (event, api) => {
  const RAW_PERMISSIONS =
    (event.consensysMocks && event.consensysMocks.permissions) ||
    '%PERMISSIONS%'

  const NAMESPACE_CUSTOM = event.secrets.CUSTOM_NAMESPACE
  const NAMESPACE_ORCHESTRATE = event.secrets.CUSTOM_ORCHESTRATE_NAMESPACE

  let permissionData

  const filterPermissions = orchestrateFilter => {
    if (!permissionData) {
      permissionData = JSON.parse(RAW_PERMISSIONS)
    }

    const permissionNames = event.accessToken.scope

    const permissionIndexes = permissionNames.map(permissionName =>
      permissionData.allPermissions.indexOf(permissionName),
    )

    const orchestrateIndexes = permissionData.orchestrate

    return permissionIndexes
      .filter(index => orchestrateIndexes.includes(index) === orchestrateFilter)
      .map(index => permissionData.allPermissions[index])
  }

  const clientMetadata = event.client.metadata || {}
  const tenantId = clientMetadata.tenantId
  const entityId = clientMetadata.entityId

  const isMultiTenant =
    event.client.name === event.secrets.MULTI_TENANT_CLIENT_NAME

  const orchestrateTenantId = isMultiTenant
    ? '*'
    : tenantId && entityId
    ? `${tenantId}:${entityId}`
    : undefined

  if (orchestrateTenantId) {
    const orchestratePermissions = filterPermissions(true)

    api.accessToken.setCustomClaim(NAMESPACE_ORCHESTRATE, {
      tenant_id: orchestrateTenantId,
      permissions: orchestratePermissions,
    })
  }

  if (tenantId || entityId) {
    const codefiPermissions = filterPermissions(false)

    api.accessToken.setCustomClaim(NAMESPACE_CUSTOM, {
      ...(tenantId ? { tenantId } : {}),
      ...(entityId ? { entityId } : {}),
      permissions: codefiPermissions,
    })
  }
}
