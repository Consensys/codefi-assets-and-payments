import config from '../config'

export function getGroupId(consumerName: string) {
  const groupId = `${config().kafka.groupId}-${config().kafka.commitSha}`
  return `${groupId}-${consumerName}`
}
