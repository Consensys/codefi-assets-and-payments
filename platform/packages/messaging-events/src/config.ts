require('dotenv').config();

const configObject = {
  nodeEnv: process.env.NODE_ENV,
  nodeName: process.env.NODE_NAME,
  commitShortSha: process.env.CI_COMMIT_SHORT_SHA,
  pipeline: process.env.PIPELINE,
};

export type ConfigType = typeof configObject;

export default function cfg(): ConfigType {
  return configObject;
}
