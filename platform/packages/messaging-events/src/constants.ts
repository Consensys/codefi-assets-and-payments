import cfg from './config';

export const fullPattern = (eventPattern: string) => {
  let full: string = cfg().nodeEnv ? `${cfg().nodeEnv}-` : '';
  full +=
    cfg().pipeline && cfg().commitShortSha ? `${cfg().commitShortSha}-` : '';
  full += cfg().nodeName ? `${cfg().nodeName}-` : '';
  full += `${eventPattern}`;
  return full;
};
