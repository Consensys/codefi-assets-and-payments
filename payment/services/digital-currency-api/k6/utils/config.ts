/* eslint-disable @typescript-eslint/camelcase */
import { IEnvironmentConfig } from './types'

export class K6 {
  public static readonly environment = __ENV.ENVIRONMENT || 'local'
  public static readonly vus = __ENV.VUS || '20'
  public static readonly rampUpTime = __ENV.RAMP_UP_TIME || '30s'
  public static readonly plateauTime = __ENV.PLATEAU_TIME || '10m'
  public static readonly rampDownTime = __ENV.RAMP_DOWN_TIME || '30s'
  public static readonly timeout = __ENV.TIMEOUT || '300s'
  public static readonly singleRun = __ENV.SINGLE_RUN || 'true'
  public static readonly projectId = __ENV.PROJECT_ID || '3547117'
  public static readonly sleepTime = __ENV.SLEEP_TIME_S || '5'
  public static readonly waitRetries = __ENV.WAIT_RETRIES || '60'
  public static readonly persistentLoad = __ENV.PERSISTENT_LOAD || 'false'
  public static readonly persistentLoadDuration =
    __ENV.PERSISTENT_LOAD_DURATION || '10m'
  public static readonly persistentLoadTPS = __ENV.PERSISTENT_LOAD_TPS || 1
  public static readonly persistentLoadTimeUnit =
    __ENV.PERSISTENT_LOAD_TIME_UNIT || '1s'
  public static readonly persistentLoadPreAllocatedVUs =
    __ENV.PERSISTENT_LOAD_PREALLOCATED_VUS || 50
  public static readonly persistentLoadMaxVUs =
    __ENV.PERSISTENT_LOAD_MAX_VUS || 100
  public static readonly persistentLoadGracefulStop =
    __ENV.PERSISTENT_LOAD_GRACEFUL_STOP || '20s'
}

export const LocalConfig: IEnvironmentConfig = {
  auth0: {
    authAudience: __ENV.AUTH0_AUDIENCE || process.env.LOCAL_AUTH0_AUDIENCE,
    authDomain: __ENV.AUTH0_DOMAIN || process.env.LOCAL_AUTH0_DOMAIN,
    authClientId: __ENV.AUTH0_CLIENT_ID || process.env.LOCAL_AUTH0_CLIENT_ID,
    authClientSecret:
      __ENV.AUTH0_CLIENT_SECRET || process.env.LOCAL_AUTH0_CLIENT_SECRET,
    grantType: 'password',
    realm: 'realm',
  },
  testUsers: {
    sender: {
      name: 'World Bank',
      password:
        __ENV.AUTH0_USER_SENDER_PASSWORD ||
        process.env.LOCAL_AUTH0_USER_SENDER_PASSWORD,
      username: 'userwithtenantid1entityid1@example.com',
      legalEntity: 'entityId1',
    },
    receiver: {
      name: 'Blue Bank',
      password:
        __ENV.AUTH0_USER_RECEIVER_PASSWORD ||
        process.env.LOCAL_AUTH0_USER_RECEIVER_PASSWORD,
      username: 'userwithtenantid1entityid2@example.com',
      legalEntity: 'entityId2',
    },
  },
  paymentUrl: __ENV.PAYMENTS_URL || 'http://localhost:3000',
  entityUrl: __ENV.ENTITY_URL || 'http://localhost:3008',
  currencyDecimals: 2,
}


export class ENVIRONMENT {
  public static readonly ALL: { [key: string]: IEnvironmentConfig } = {
    local: LocalConfig,
  }
}

export function getConfigurationOptions(name) {
  return {
    stages:
      K6.singleRun === 'true'
        ? []
        : [
            // simulate ramp-up of traffic
            {
              duration: K6.rampUpTime,
              target: parseInt(K6.vus, 10),
            },
            // stable number of users
            {
              duration: K6.plateauTime,
              target: parseInt(K6.vus, 10),
            },
            // ramp-down to 0 users
            { duration: K6.rampDownTime, target: 0 },
          ],
    setupTimeout: K6.timeout,
    // to have a persistent load
    scenarios:
      K6.persistentLoad === 'false'
        ? null
        : {
            constant_request_rate: {
              executor: 'constant-arrival-rate',
              rate: K6.persistentLoadTPS,
              timeUnit: K6.persistentLoadTimeUnit, // rate iterations per time unit, i.e. 70 RPS
              duration: K6.persistentLoadDuration,
              preAllocatedVUs: K6.persistentLoadPreAllocatedVUs, // how large the initial pool of VUs would be
              maxVUs: K6.persistentLoadMaxVUs, // if the preAllocatedVUs are not enough, we can initialize more
              gracefulStop: K6.persistentLoadGracefulStop,
            },
          },
    thresholds: {
      'iteration_duration{group:::setup}': [`max>=0`],
      'http_reqs{group:::setup}': [`count>=0`],
    },
    ext: {
      loadimpact: {
        projectID: parseInt(K6.projectId),
        name,
        note: K6.environment,
      },
    },
  }
}
