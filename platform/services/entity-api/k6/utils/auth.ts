import { check } from 'k6'
import http, { Params } from 'k6/http'
import { cfg } from './config'

export function createUserToken(
  username = cfg().user.username,
  password = cfg().user.password,
) {
  const k6Params: Params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: cfg().k6.timeout,
    tags: { name: '/oauth/token' },
  }

  const response = http.post(
    `https://${cfg().auth0.domain}/oauth/token`,
    JSON.stringify({
      username,
      password,
      realm: cfg().auth0.realm,
      grant_type: cfg().auth0.grantType,
      scope: 'openid profile email',
      audience: cfg().auth0.audience,
      client_id: cfg().auth0.clientId,
      client_secret: cfg().auth0.clientSecret,
    }),
    k6Params,
  )

  check(response, {
    'Successful Auth Response': (r) => r.status === 200,
  })

  check(response, {
    'Is Bearer Token': (res) => res.json('token_type') === 'Bearer',
    'Has Valid Expiration': (res) => res.json('expires_in') > 0,
  })

  if (response.status != 200) {
    console.log(
      'Auth Token Request Error',
      JSON.stringify(JSON.parse(response.body as string), null, 4),
    )
  }

  const accessToken = response.json('access_token')

  return 'Bearer ' + accessToken
}
