/* eslint-disable @typescript-eslint/camelcase */
import { check } from 'k6'
import http, { Params } from 'k6/http'
import * as defaults from './config'

function createUserToken(username, password) {
  console.log(`${__VU}: Fetching bearer token for ${username}`)
  const k6Params: Params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: defaults.K6.timeout,
    tags: { name: '/oauth/token' },
  }
  const response = http.post(
    `https://${
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].auth0.authDomain
    }/oauth/token`,
    JSON.stringify({
      username,
      password,
      realm:
        defaults.ENVIRONMENT.ALL[defaults.K6.environment].auth0.realm ??
        undefined,
      grant_type:
        defaults.ENVIRONMENT.ALL[defaults.K6.environment].auth0.grantType,
      scope: 'openid profile email',
      audience:
        defaults.ENVIRONMENT.ALL[defaults.K6.environment].auth0.authAudience,
      client_id:
        defaults.ENVIRONMENT.ALL[defaults.K6.environment].auth0.authClientId,
      client_secret:
        defaults.ENVIRONMENT.ALL[defaults.K6.environment].auth0
          .authClientSecret,
    }),
    k6Params,
  )
  check(response, {
    'BearerToken: is good': (r) => r.status === 200,
  })

  check(response, {
    'Bearer token': (res) => res.json('token_type') === 'Bearer',
    'Valid expiration': (res) => res.json('expires_in') > 0,
  })
  console.log(`auth response status: ${response.status_text}`)

  const accessToken = response.json('access_token')
  return 'Bearer ' + accessToken
}

export function getAuthHeaders(username, password): { [name: string]: string } {
  return {
    'Content-Type': 'application/json',
    Authorization: createUserToken(username, password),
  }
}
