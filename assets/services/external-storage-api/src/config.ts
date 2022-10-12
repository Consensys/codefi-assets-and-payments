import { envBool, envInt, envString } from "./utils/config-utils";
import ormConfig from "./ormconfig";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

let configObject;

function loadConfig() {
  return {
    serverPort: envInt("PORT", 3000),
    logLevel: process.env.LOG_LEVEL || "debug",
    db: ormConfig,
    exportDocs: envBool("EXPORT_DOCS", false),
    logPretty: envBool("LOG_PRETTY_PRINT", true),
    appEnv: envString("APP_ENV", "dev"),
    ipfs: {
      projectId: envString("IPFS_PROJECT_ID", ""),
      projectSecret: envString("IPFS_PROJECT_SECRET", ""),
      host: envString("IPFS_HOST", "https://ipfs.infura.io:5001"),
    },
    aws: {
      region: envString("AWS_REGION", ""),
      defaultBucket: envString("AWS_S3_BUCKET_NAME", "default-bucket"),
    },
  };
}

export type ConfigType = ReturnType<typeof loadConfig>;

export default function config(): ConfigType {
  if (!configObject) {
    configObject = loadConfig();
  }

  return configObject;
}
