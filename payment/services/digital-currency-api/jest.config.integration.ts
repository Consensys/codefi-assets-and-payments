import type { Config } from '@jest/types'

// Or async function
export default async (): Promise<Config.InitialOptions> => {
  return {
    verbose: true,
    setupFiles: ["dotenv/config"],
    setupFilesAfterEnv: ['<rootDir>/test/customConsole.ts'],
    globalSetup: './integration/utils/globalSetup.ts',
    globalTeardown: './integration/utils/globalTeardown.ts',
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: './',
    testRegex: '.test.ts$',
    preset: 'ts-jest',
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    testEnvironment: 'node',
    reporters: ['default', 'jest-junit'],
  }
}
