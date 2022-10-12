let configObject

enum Mode {
  SINGLE = 'single',
  STAGES = 'stages',
  CONSTANT = 'constant',
}

const envRaw = (name: string): string => {
  return __ENV[`K6_${name}`]
}

const envString = (name: string, defaultValue?: string): string => {
  const rawValue = envRaw(name)
  if (rawValue) return rawValue
  if (defaultValue) return defaultValue
  throw new Error(`Required environment variable not specified | Name: ${name}`)
}

const envNumber = (name: string, defaultValue: number): number => {
  const rawValue = envRaw(name)
  return rawValue ? parseInt(rawValue) : defaultValue
}

const envEnum = <T>(
  name: string,
  validValues: string[],
  defaultValue: T,
): T => {
  const rawValue = envRaw(name)

  if (!rawValue) return defaultValue

  if (!validValues.includes(rawValue))
    throw `Environment variable is invalid - Name: ${name} | Valid Values: ${validValues.join(
      ', ',
    )} | Provided Value: ${rawValue}`

  return rawValue as unknown as T
}

const envBool = (name: string, defaultValue: boolean): boolean => {
  const rawValue = envRaw(name)
  if (rawValue === undefined) return defaultValue
  return rawValue === 'true'
}

const envList = (name: string, defaultValues: string[]): string[] => {
  const values = []
  let index = 0

  while (true) {
    const indexValue = envRaw(`${name}_${index}`)
    const value = index == 0 ? envRaw(name) || indexValue : indexValue

    if (value) {
      values.push(value)
      index++
    } else {
      break
    }
  }

  return values.length ? values : defaultValues
}

const loadConfig = () => ({
  k6: {
    mode: envEnum<Mode>(
      'MODE',
      [Mode.SINGLE, Mode.STAGES, Mode.CONSTANT],
      Mode.SINGLE,
    ),
    vus: envNumber('VUS', 20),
    timeout: envString('TIMEOUT', '300s'),
    projectId: envNumber('PROJECT_ID', 3547117),
    stages: {
      rampUpTime: envString('STAGES_RAMP_UP_TIME', '30s'),
      plateauTime: envString('STAGES_PLATEAU_TIME', '10m'),
      rampDownTime: envString('STAGES_RAMP_DOWN_TIME', '30s'),
    },
    constant: {
      duration: envString('CONSTANT_DURATION', '10m'),
      tps: envNumber('CONSTANT_TPS', 5),
      timeUnit: envString('CONSTANT_TIME_UNIT', '1s'),
      preAllocatedVUs: envNumber('CONSTANT_PREALLOCATED_VUS', 10),
      gracefulStop: envString('CONSTANT_GRACEFUL_STOP', '20s'),
    },
  },
  auth0: {
    audience: envString('AUTH0_AUDIENCE', 'https://api.codefi.network'),
    domain: envString('AUTH0_DOMAIN', 'codefi.eu.auth0.com'),
    clientId: envString('AUTH0_CLIENT_ID', '0AUoQmknnUS7Koib0jvFxuUnTMDa2hVh'),
    clientSecret: envString('AUTH0_CLIENT_SECRET'),
    grantType: 'password',
    realm: undefined,
  },
  user: {
    username: envString('USER', 'userwithtenantid1entityid1@example.com'),
    password: envString('USER_PASSWORD'),
  },
  kafka: {
    brokers: envList('KAFKA_BROKER', ['kafka:9092']),
    schemaRegistry: envString(
      'KAFKA_SCHEMA_REGISTRY',
      'http://schema-registry:8081',
    ),
    partitionCount: envNumber('KAFKA_PARTITION_COUNT', 1),
    topicPrefix: envString('KAFKA_TOPIC_PREFIX', 'development-'),
    waitTimeout: envNumber('KAFKA_WAIT_TIMEOUT', 30000),
    consumeTimeout: envNumber('KAFKA_CONSUME_TIMEOUT', 500),
  },
  apiUrl: envString('ENTITY_API_URL', 'http://entity-api:3000'),
  singleTenant: envBool('SINGLE_TENANT', false),
  singleEntity: envBool('SINGLE_ENTITY', false),
  singleWallet: envBool('SINGLE_WALLET', false),
})

export type ConfigType = ReturnType<typeof loadConfig>

export const cfg = (): ConfigType => {
  if (!configObject) {
    configObject = loadConfig()
  }

  return configObject
}

export const getK6Config = (testName: string) => {
  return {
    setupTimeout: cfg().k6.timeout,
    ext: {
      loadimpact: {
        projectID: cfg().k6.projectId,
        name: testName,
      },
    },
    stages:
      cfg().k6.mode !== Mode.STAGES
        ? undefined
        : [
            // Ramp Up
            {
              duration: cfg().k6.stages.rampUpTime,
              target: cfg().k6.vus,
            },
            // Stable
            {
              duration: cfg().k6.stages.plateauTime,
              target: cfg().k6.vus,
            },
            // Ramp Down
            { duration: cfg().k6.stages.rampDownTime, target: 0 },
          ],
    // Constant Load
    scenarios:
      cfg().k6.mode !== Mode.CONSTANT
        ? undefined
        : {
            constant_request_rate: {
              executor: 'constant-arrival-rate',
              rate: cfg().k6.constant.tps,
              timeUnit: cfg().k6.constant.timeUnit,
              duration: cfg().k6.constant.duration,
              preAllocatedVUs: cfg().k6.constant.preAllocatedVUs,
              maxVUs: cfg().k6.vus,
              gracefulStop: cfg().k6.constant.gracefulStop,
            },
          },
  }
}
