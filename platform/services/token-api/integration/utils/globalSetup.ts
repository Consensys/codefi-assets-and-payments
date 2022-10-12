import { INTEGRATION_TEST, PIPELINE } from './configs'
import { startNodeServer } from './server'
import { getAuthTokenWithTenantId1, registerChain } from './testCommonUtils'

module.exports = async () => {
  if (!INTEGRATION_TEST) return

  console.log('Started global setup')

  if (!PIPELINE) {
    await startNodeServer()
  }

  const authToken = await getAuthTokenWithTenantId1()
  await registerChain(authToken)

  console.log('Completed global setup')
}
