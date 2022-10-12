import { healthCheck } from './requests'
import { API_BASE_URL } from './configs'
import { wait } from './awaits'

export const testServiceReadiness = async () => {
  console.log('checking service readiness')
  await wait(
    async () => healthReturnsUnauth(),
    60000,
    200,
    `Waiting for healthcheck to be ready`,
  )
  console.log('checking service readiness - done')
}

const healthReturnsUnauth = async (): Promise<boolean> => {
  try {
    console.log(`checking ${API_BASE_URL} for healthiness(unauth)`)
    await healthCheck()
    return false
  } catch (e) {
    return e.response.status === 401 && e.response.statusText === 'Unauthorized'
  }
}

(async () => {
  await testServiceReadiness()
})().catch(err => {
  console.error(err)
  throw err
});
