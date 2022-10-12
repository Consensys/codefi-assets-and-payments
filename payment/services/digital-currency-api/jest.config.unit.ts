import type { Config } from '@jest/types'

// Or async function
export default async (): Promise<Config.InitialOptions> => {
  return {
    verbose: true,
    setupFiles: ['<rootDir>/test/setEnvVars.ts'],
    setupFilesAfterEnv: ['<rootDir>/test/customConsole.ts'],
    moduleFileExtensions: ['js', 'json', 'ts'],
    coverageThreshold: {
      global: {
        statements: 90,
        branches: 75,
        functions: 80,
        lines: 90,
      },
    },
    rootDir: './',
    testRegex: '.test.ts$',
    preset: 'ts-jest',
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
      'src/*/**/*.{ts,js}',
      '!src/**/{server,sleep,jwtUtils}.{ts,js}',
      '!src/{validation,modules,guards}/**',
      '!src/services/instances/**',
      '!src/services/PersistentConfigurationService.ts',
      '!src/services/LegalEntityService.ts',
      '!src/data/obj/**',
      '!src/requests/**',
      '!src/migration/**',
      '!src/controllers/LegalEntityController.ts',
      '!src/controllers/HealthCheckController.ts',
    ],
    coverageDirectory: './coverage',
    testEnvironment: 'node',
    testResultsProcessor: 'jest-sonar-reporter',
    reporters: ['default', 'jest-junit'],
  }
}
