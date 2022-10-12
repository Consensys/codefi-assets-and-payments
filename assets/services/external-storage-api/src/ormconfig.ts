import { envBool, envInt, envString } from "./utils/config-utils";

const isTest = process.env.APP_ENV === "test";

export = {
  type: "postgres" as const,
  enabled: envBool("DB_ENABLE", true),
  host: envString("DB_HOST", ""),
  port: envInt("DB_PORT", isTest ? 5433 : 5432),
  username: envString("DB_USERNAME", "postgres"),
  password: envString("DB_PASSWORD", "postgres"),
  database: envString("DB_DATABASE_NAME", isTest ? "test" : ""),
  logging: envBool("DB_LOGGING", false),
  cache: envBool("DB_CACHE", false),
  synchronize: envBool("DB_SYNCHRONIZE", false),
  dropSchema: envBool("DB_DROP_SCHEMA", false),
  entities: [__dirname + "/**/*Entity{.ts,.js}"],
  migrationsRun: true,
  migrations: [__dirname + "/migrations/**/*{.ts,.js}"],
  cli: {
    migrationsDir: "src/migrations",
  },
};
