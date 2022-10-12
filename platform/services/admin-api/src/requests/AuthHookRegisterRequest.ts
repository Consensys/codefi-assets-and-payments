export class AuthHookRegisterRequest {
  user: User
  context: Context
}

export class Identity {
  provider?: string
  access_token?: string
  expires_in?: number
  user_id?: string
  connection?: string
  isSocial?: boolean
  profileData?: any
}

export class User {
  user_id: string
  email: string
  name: string
  _id?: string
  clientID?: string
  created_at?: Date
  username?: string
  email_verified?: boolean
  family_name?: string
  given_name?: string
  identities?: Identity[]
  locale?: string
  permissions?: string
  nickname?: string
  picture?: string
  updated_at?: Date
  last_password_reset?: Date
  global_client_id?: string
  persistent?: any
  app_metadata?: any
  multifactor?: string[]
  phone_number?: string
  phone_verified?: boolean
  user_metadata?: any
}

export class Stats {
  loginsCount?: number
}

export class Sso {
  with_auth0?: boolean
  with_dbconn?: boolean
  current_clients?: string[]
}

export class Method {
  name?: string
  timestamp?: number
}

export class Authentication {
  methods?: Method[]
}

export class Geoip {
  country_code?: string
  country_code3?: string
  country_name?: string
  city_name?: string
  latitude?: number
  longitude?: number
  time_zone?: string
  continent_code?: string
}

export class Request {
  userAgent?: string
  ip?: string
  hostname?: string
  query?: any
  body?: any
  geoip?: Geoip
}

export class Authorization {
  roles: any[]
}

/**
 * https://auth0.com/docs/rules/references/context-object
 */
export class Context {
  tenant?: string
  clientID?: string
  clientName?: string
  clientMetadata?: any
  connection?: string
  connectionStrategy?: string
  connectionID?: string
  connectionOptions?: any
  connectionMetadata?: any
  samlConfiguration?: any
  jwtConfiguration?: any
  protocol?: string
  stats?: Stats
  sso?: Sso
  accessToken?: any
  idToken?: any
  authentication?: Authentication
  original_protocol?: any
  multifactor?: any
  sessionID?: string
  redirect?: any
  request?: Request
  authorization?: Authorization
  primaryUser?: string
}
