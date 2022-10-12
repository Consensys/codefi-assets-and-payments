import jwtDecode from 'jwt-decode';
import isArray from 'lodash/isArray';
import { RequestMethod } from 'constants/apiRoutes';

import { execRetry } from './retry';
import { generateCode } from './commonUtils';
import { logout, getTokenSilently } from 'auth/auth0';
import store from 'features/app.store';
import { userSelector } from 'features/user/user.store';

export interface IDataCallParams {
  method?: RequestMethod;
  path: string;
  urlParams?: {
    [key: string]: string | number | boolean | undefined;
  };
  expectedResponseType?: 'json' | 'blob' | 'arrayBuffer' | 'formData' | 'text';
  body?: Record<string, unknown> | FormData;
  headers?: {
    [key: string]: string | number | boolean;
  };
}

const DataCall = async ({
  body,
  expectedResponseType = 'json',
  headers = {},
  method = 'GET',
  path,
  urlParams,
}: IDataCallParams) => {
  let requestURL = path;

  /**
   * We inject the user id in a query param named callerId
   * in every call when the user is logged.
   */

  const user = userSelector(store.getState());
  if (user) {
    urlParams = {
      userId: user.id,
      callerId: user.id,
      ...(urlParams || {}),
    };
  }

  /**
   * Inject the url params in the request url
   */
  if (urlParams && Object.keys(urlParams).length > 0) {
    requestURL += '?';
    requestURL += Object.entries(urlParams)
      .map((entry) => `${entry[0]}=${entry[1]}`)
      .join('&');
  }

  /**
   * Build the headers
   */
  const requestHeaders = new Headers();
  let accessToken: string = await getTokenSilently();
  if (accessToken) {
    const decodedAccessToken: any = jwtDecode(accessToken);
    const auth0ApiUrl =
      process.env.REACT_APP_AUTH_AUDIENCE || 'https://api.codefi.network';
    if (!decodedAccessToken[auth0ApiUrl]?.entityId) {
      accessToken = await getTokenSilently({ ignoreCache: true });
    }
    requestHeaders.append('authorization', `Bearer ${accessToken}`);
  }

  for (const header of Object.entries(headers)) {
    requestHeaders.append(header[0], String(header[1]));
  }

  /**
   * Build the body
   */
  let requestBody = null;
  if (body) {
    if (body instanceof FormData) {
      requestBody = body;
    } else if (isArray(body)) {
      requestBody = JSON.stringify(body);
      requestHeaders.append('Content-Type', 'application/json');
    } else if (typeof body === 'object') {
      requestBody = JSON.stringify({
        ...body,
        idempotencyKey: generateCode(),
      });
      requestHeaders.append('Content-Type', 'application/json');
    }
  }

  /**
   * Make the request
   */
  const params: RequestInit = {
    method,
    headers: requestHeaders,
    body: requestBody,
  };

  const retriedClosure = () => {
    return fetch(requestURL, params);
  };
  const request = await execRetry(retriedClosure, 3, 5000);

  if (request.status === 401) {
    await logout({ returnTo: window.location.origin });
  }

  if (request.status === 404) {
    throw Error(`404 Route not found: ${request.url}`);
  }

  if (
    request.status !== 200 &&
    request.status !== 201 &&
    request.status !== 202
  ) {
    const textError = await request.text();
    let error;
    try {
      error = JSON.parse(textError);
    } catch {
      error = textError;
    }
    throw Error(`${error.code || 500} ${error.message || String(error)}`);
  }

  switch (expectedResponseType) {
    case 'json':
      return await request.json();
    case 'blob':
      return await request.blob();
    case 'arrayBuffer':
      return await request.arrayBuffer();
    case 'formData':
      return await request.formData();
    case 'text':
      return await request.text();
    default:
      return await request.json();
  }
};

export { DataCall };
