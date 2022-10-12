import { Grant } from 'auth0'
export class ClientResponse {
  /**
   * The name of the client.
   */
  name: string
  /**
   * Free text description of the purpose of the Client. (Max character length: `140`).
   */
  description?: string
  /**
   * The id of the client.
   */
  clientId: string
  /**
   * The client secret, it must not be public.
   */
  clientSecret: string
  /**
   * The type of application this client represents.
   */
  appType?: string
  /**
   * The URL of the client logo (recommended size: 150x150).
   */
  logoUri?: string
  /**
   * Whether this client a first party client or not.
   */
  isFirstParty?: boolean
  /**
   * Whether this client will conform to strict OIDC specifications.
   */
  oidcConformant?: boolean
  /**
   * The URLs that Auth0 can use to as a callback for the client.
   */
  callbacks?: string[]
  allowedOrigins?: string[]
  webOrigins?: string[]
  clientAliases?: string[]
  allowedClients?: string[]
  allowedLogoutUrls?: string[]
  jwtConfiguration?: {
    // The amount of time (in seconds) that the token will be valid after being issued
    lifetimeInSeconds?: number
    scopes?: any
    // The algorithm used to sign the JsonWebToken
    alg?: 'HS256' | 'RS256'
  }
  /**
   * A set of grant types that the client is authorized to use
   * 'authorization_code'
   * 'client_credentials'
   * 'implicit'
   * 'password'
   * 'refresh_token'
   */
  grantTypes?: Grant[]
  /**
   * Client signing keys.
   */
  signingKeys?: string[]
  encryptionKey?: {
    pub?: string
    cert?: string
    subject?: string
  }
  sso?: boolean
  /**
   * `true` to disable Single Sign On, `false` otherwise (default: `false`)
   */
  ssoDisabled?: boolean
  /**
   * `true` if this client can be used to make cross-origin authentication requests, `false` otherwise (default: `false`)
   */
  crossOriginAuth?: boolean
  /**
   * Url of the location in your site where the cross origin verification takes place for the cross-origin auth flow when performing Auth in your own domain instead of Auth0 hosted login page.
   */
  crossOriginLoc?: string
  /**
   * `true` if the custom login page is to be used, `false` otherwise. (default: `true`)
   */
  customLoginPageOn?: boolean
  customLoginPage?: string
  customLoginPagePreview?: string
  formTemplate?: string
  addons?: any
  /**
   * Defines the requested authentication method for the token endpoint. Possible values are 'none' (public client without a client secret), 'client_secret_post' (client uses HTTP POST parameters) or 'client_secret_basic' (client uses HTTP Basic) ['none' or 'client_secret_post' or 'client_secret_basic']
   */
  tokenEndpointAuthMethod?: string
  clientMetadata?: any
  mobile?: any
  initiateLoginUri?: string
}
