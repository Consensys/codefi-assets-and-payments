export interface IEnvironmentConfig {
  auth0: IAuthConfig
  testUsers: IUserConfig
  paymentUrl: string
  entityUrl: string
  currencyDecimals: number
}

export interface IK6Config {
  vus: string
  rampUpTime: string
  plateauTime: string
  rampDownTime: string
  timeout: string
  singleRun: string
  projectId: string
  sleepTime: string
  waitRetries: string
}

export interface IAuthConfig {
  authAudience: string
  authDomain: string
  authClientId: string
  authClientSecret: string
  grantType: string
  realm?: string
}

export interface IUser {
  name: string
  password: string
  username: string
  legalEntity: string
}

export interface IUserConfig {
  sender: IUser
  receiver: IUser
}
