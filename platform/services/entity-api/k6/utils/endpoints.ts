import http from 'k6/http'
import { check } from 'k6'
import { cfg } from './config'
import { logResponseBody } from './utils'

export const getTenantId = (tenantIds: string[]): string => {
  return cfg().singleTenant ? tenantIds[0] : tenantIds[__VU]
}

export const getEntityId = (entityIds: string[]) => {
  return cfg().singleEntity && cfg().singleTenant
    ? entityIds[0]
    : entityIds[__VU]
}

export const createTenant = (request: any, authToken: string): any => {
  const response = http.post(
    `${cfg().apiUrl}/tenant`,
    JSON.stringify(request),
    {
      headers: { 'Content-Type': 'application/json', Authorization: authToken },
    },
  )

  check(response, {
    'Successful Tenant Create Request': (r) => r.status === 201,
  })

  if (response.status !== 201) {
    logResponseBody(response, 'Tenant Create Error')
  }

  return response.json()
}

export const createTenants = (
  requestFactory: () => any,
  authToken: string,
): { ids: string[]; responses: any[] } => {
  const tenantCount = cfg().singleTenant ? 1 : cfg().k6.vus
  const responses = []

  for (let i = 0; i < tenantCount; i++) {
    const request = requestFactory()
    const response = createTenant(request, authToken)
    responses.push(response)
  }

  return { ids: responses.map((response) => response.id), responses }
}

export function updateTenant(
  tenantId: string,
  request: any,
  authToken: string,
) {
  const response = http.put(
    `${cfg().apiUrl}/tenant/${tenantId}`,
    JSON.stringify(request),
    {
      headers: { 'Content-Type': 'application/json', Authorization: authToken },
    },
  )

  check(response, {
    'Successful Tenant Update Request': (r) => r.status === 200,
  })

  if (response.status !== 200) {
    logResponseBody(response, 'Tenant Update Error')
  }
}

export function deleteTenant(tenantId: string, authToken: string) {
  const response = http.del(`${cfg().apiUrl}/tenant/${tenantId}`, '', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: authToken,
    },
  })

  check(response, {
    'Successful Tenant Delete Request': (r) => r.status === 204,
  })

  if (response.status !== 204) {
    logResponseBody(response, 'Tenant Delete Error')
  }
}

export function createEntity(
  tenantId: string,
  request: any,
  authToken: string,
): any {
  const response = http.post(
    `${cfg().apiUrl}/entity`,
    JSON.stringify(request),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authToken,
        'x-tenant-id': tenantId,
      },
    },
  )

  check(response, {
    'Successful Entity Create Request': (r) => r.status === 201,
  })

  if (response.status !== 201) {
    logResponseBody(response, 'Entity Create Error')
  }

  return response.json()
}

export const createEntities = (
  tenantIds: string[],
  requestFactory: () => any,
  authToken: any,
): { ids: string[]; responses: any[] } => {
  const entityCount =
    cfg().singleEntity && cfg().singleTenant ? 1 : cfg().k6.vus
  const responses = []

  for (let i = 0; i < entityCount; i++) {
    const tenantId = cfg().singleTenant ? tenantIds[0] : tenantIds[i]
    const request = requestFactory()
    const response = createEntity(tenantId, request, authToken)

    responses.push(response)
  }

  return { ids: responses.map((response) => response.id), responses }
}

export function updateEntity(
  tenantId: string,
  entityId: string,
  request: any,
  authToken: string,
) {
  const response = http.put(
    `${cfg().apiUrl}/entity/${entityId}`,
    JSON.stringify(request),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authToken,
        'x-tenant-id': tenantId,
      },
    },
  )

  check(response, {
    'Successful Entity Update Request': (r) => r.status === 200,
  })

  if (response.status !== 200) {
    logResponseBody(response, 'Entity Update Error')
  }
}

export function deleteEntity(
  tenantId: string,
  entityId: string,
  authToken: string,
) {
  const response = http.del(`${cfg().apiUrl}/entity/${entityId}`, '', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: authToken,
      'x-tenant-id': tenantId,
    },
  })

  check(response, {
    'Successful Entity Delete Request': (r) => r.status === 204,
  })

  if (response.status !== 204) {
    logResponseBody(response, 'Entity Delete Error')
  }
}

export function createWallet(
  tenantId: string,
  entityId: string,
  request: any,
  authToken: string,
): any {
  const response = http.post(
    `${cfg().apiUrl}/entity/${entityId}/wallet`,
    JSON.stringify(request),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authToken,
        'x-tenant-id': tenantId,
      },
    },
  )

  check(response, {
    'Successful Wallet Create Request': (r) => r.status === 201,
  })

  if (response.status !== 201) {
    logResponseBody(response, 'Wallet Create Error')
  }

  return response.json()
}

export function updateWallet(
  tenantId: string,
  entityId: string,
  walletAddress: string,
  request: any,
  authToken: string,
) {
  const response = http.put(
    `${cfg().apiUrl}/entity/${entityId}/wallet/${walletAddress.toLowerCase()}`,
    JSON.stringify(request),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authToken,
        'x-tenant-id': tenantId,
      },
    },
  )

  check(response, {
    'Successful Wallet Update Request': (r) => r.status === 200,
  })

  if (response.status !== 200) {
    logResponseBody(response, 'Wallet Update Error')
  }
}

export function deleteWallet(
  tenantId: string,
  entityId: string,
  walletAddress: string,
  authToken: string,
) {
  const response = http.del(
    `${cfg().apiUrl}/entity/${entityId}/wallet/${walletAddress}`,
    '',
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authToken,
        'x-tenant-id': tenantId,
      },
    },
  )

  check(response, {
    'Successful Wallet Delete Request': (r) => r.status === 204,
  })

  if (response.status !== 204) {
    logResponseBody(response, 'Wallet Delete Error')
  }
}
