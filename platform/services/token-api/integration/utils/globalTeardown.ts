import { INTEGRATION_TEST } from './configs'
import { deleteChain, getAuthTokenWithTenantId1 } from './testCommonUtils'

module.exports = async () => {
  if (!INTEGRATION_TEST) return

  console.log('Started global teardown')

  const authToken = await getAuthTokenWithTenantId1()
  await deleteChain(authToken)

  console.log('Completed global teardown')
}
