/* istanbul ignore file */
import config from '../config'

export function getGroupId(consumerName: string) {
  const groupId = `${config().kafka.groupId}-${config().commitSha}`
  return `${groupId}-${consumerName}`
}
