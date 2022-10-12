import {
  decodeTokenFromRequest,
  extractEntityIdFromToken,
  extractPermissionsFromToken,
  extractTenantIdFromRequestAndHeader,
} from '@codefi-assets-and-payments/auth'
import { Request } from 'express'
import { UnauthorizedException } from '@codefi-assets-and-payments/error-handler'
import { LocalErrorName } from '..//LocalErrorNameEnum'

const ACTION_READ = ['retrieve', 'retrieved']
const ACTION_UPDATE = ['update', 'updated']
const ACTION_DELETE = ['delete', 'deleted']

const ACTIONS_BY_PERMISSION = {
  'read_all:tenant': ACTION_READ,
  'update_all:tenant': ACTION_UPDATE,
  'delete_all:tenant': ACTION_DELETE,
  'read_all:entity': ACTION_READ,
  'update_all:entity': ACTION_UPDATE,
  'delete_all:entity': ACTION_DELETE,
}

export const checkTenantMatchesRequest = (
  request: Request,
  requestedTenantId: string,
  permission: string,
) => {
  checkDataMatchesRequest(request, requestedTenantId, permission, false)
}

export const checkEntityMatchesRequest = (
  request: Request,
  requestedEntityId: string,
  permission: string,
): { tenantId: string; decodedToken: any } => {
  const { tokenTenantId: tenantId, decodedToken } = checkDataMatchesRequest(
    request,
    requestedEntityId,
    permission,
    true,
  )
  return { tenantId, decodedToken }
}

const checkDataMatchesRequest = (
  request: Request,
  requestedValue: string,
  permission: string,
  isEntity: boolean,
) => {
  const decodedToken = decodeTokenFromRequest(request)
  const tokenTenantId = extractTenantIdFromRequestAndHeader(request)

  const tokenEntityId = isEntity
    ? extractEntityIdFromToken(decodedToken)
    : undefined

  const result = { tokenTenantId, tokenEntityId, decodedToken }
  const tokenValue = isEntity ? tokenEntityId : tokenTenantId

  if (requestedValue === tokenValue) return result

  const permissions = extractPermissionsFromToken(decodedToken)

  if (permissions.includes(permission)) return result

  const noun = isEntity ? 'entity' : 'tenant'
  const action = ACTIONS_BY_PERMISSION[permission][0]
  const actionPastTense = ACTIONS_BY_PERMISSION[permission][1]

  throw new UnauthorizedException(
    LocalErrorName.InsufficientPermissionsException,
    `User without '${permission}' permission can only ${action} his own ${noun} (${tokenValue}), ${noun} with id ${requestedValue} cannot be ${actionPastTense}`,
    {
      requestedValue,
      tokenValue,
      decodedToken,
      permissions,
    },
  )
}

export const buildMetadataQuery = (
  alias: string,
  metadata: object,
  metadataWithOptions: { [key: string]: any[] },
) => {
  const queries = []

  if (metadata) {
    queries.push(`${alias} @> :metadata`)
  }

  if (metadataWithOptions) {
    for (const key in metadataWithOptions) {
      queries.push(`${alias} ->> '${key}' IN (:...${key})`)
    }
  }

  return queries.join(' AND ')
}
