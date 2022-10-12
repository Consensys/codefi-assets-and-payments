import { Request } from 'express';
import jwt from 'jsonwebtoken';
import cfg from '../config';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const encodeToken = (decodedToken: any): string =>
  jwt.sign(decodedToken, 'test');

export const craftDecodedTokenWithSuperOrchestrateTenantId = (
  subject: string,
  permissions: string[] = []
): any => {
  const decodedToken = {
    sub: subject,
  };

  // Only required when 'authToken' is meant to be sent to orchestrate
  if (cfg().orchestrateNamespace) {
    decodedToken[cfg().orchestrateNamespace] = {
      tenant_id: '*',
    };
  }

  if (permissions) {
    decodedToken['permissions'] = permissions;
  }
  return decodedToken;
};

export const craftAuthTokenWithSuperOrchestrateTenantId = (
  subject: string,
  permissions: string[] = []
): string => {
  const decodedToken = craftDecodedTokenWithSuperOrchestrateTenantId(
    subject,
    permissions
  );
  const authToken: string = encodeToken(decodedToken);
  return authToken;
};

export const craftDecodedTokenWithTenantId = (
  tenantId: string,
  entityId: string,
  subject: string,
  permissions: string[] = []
): any => {
  const decodedToken = {
    sub: subject,
  };

  const customNamespace = cfg().customNamespace;

  decodedToken[customNamespace] = {
    tenantId,
    entityId,
  };

  // Only required when 'authToken' is meant to be sent to orchestrate
  if (tenantId && entityId && cfg().orchestrateNamespace) {
    decodedToken[cfg().orchestrateNamespace] = {
      tenant_id: `${tenantId}:${entityId}`,
    };
  }

  const checkPermissionsCustomClaim = cfg().checkPermissionsCustomClaim;

  if (!checkPermissionsCustomClaim && permissions) {
    decodedToken['permissions'] = permissions;
  }

  if (checkPermissionsCustomClaim && permissions) {
    decodedToken[customNamespace] = {
      ...decodedToken[customNamespace],
      permissions,
    };
  }

  return decodedToken;
};

export const craftAuthTokenWithTenantId = (
  tenantId: string,
  entityId: string,
  subject: string,
  permissions: string[] = []
): string => {
  const decodedToken = craftDecodedTokenWithTenantId(
    tenantId,
    entityId,
    subject,
    permissions
  );
  const authToken: string = encodeToken(decodedToken);
  return authToken;
};

export const craftRequestWithAuthHeaders = (
  tenantId: string,
  entityId: string,
  subject: string,
  permissions: string[] = []
): Request => {
  const requestHeadersWithTenantId = {
    headers: {},
    sub: subject,
  };

  const authToken = craftAuthTokenWithTenantId(
    tenantId,
    entityId,
    subject,
    permissions
  );
  requestHeadersWithTenantId.headers['authorization'] = `Bearer ${authToken}`;
  return requestHeadersWithTenantId as any;
};

export const createMockLogger = (): any => {
  const mock: any = {
    info: () => undefined,
    debug: () => undefined,
    trace: () => undefined,
  };

  mock.child = () => mock;

  return mock;
};
