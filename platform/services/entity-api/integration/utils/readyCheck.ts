import { healthCheck } from './requests'
import { API_BASE_URL } from './configs'

const VALID_HEALTHCHECK_MESSAGE = 'OK'
/**
 * @param fn function that examines if condition is mer (must return boolean)
 * @param timeout
 * @param delay
 * @param condition texttual description of the condition
 */
export async function wait(
  fn: (...args) => Promise<boolean>,
  timeout = 30000,
  delay = 200,
  condition = '',
): Promise<any> {
  const startTime = Number(new Date())
  const endTime: number = startTime + timeout

  const test = (resolve, reject) => {
    const result: Promise<boolean> = fn()

    result
      .then(res => {
        if (res) {
          console.log(
            `SUCCESS: condition met after ${Number(new Date()) - startTime} ms! ${condition}`,
          )
          resolve(res)
        } else if (Number(new Date()) < endTime) { setTimeout(test, delay, resolve, reject) } else {
          reject(
            new Error(
              `Wait: timed out after ${timeout}. Failed to validate: ${
                !!condition ? condition : 'condition description not provided'
              }`,
            ),
          )
 }
      })
      .catch(err => {
        if (Number(new Date()) < endTime) { setTimeout(test, delay, resolve, reject) } else {
          reject(
            new Error(
              `Wait: timed out after ${timeout}. Failed to validate ${
                !!condition ? condition : 'condition description not provided'
              }\nError: ${err}`,
            ),
          )
        }
      })
  }

  return new Promise(test)
}

const healthReturnsUnauth = async (): Promise<boolean> => {
  try {
    console.log(`Waiting ${API_BASE_URL} to be ready (HealthCheck/Un-auth)`)
    const response = await healthCheck(false)
    return response.data === VALID_HEALTHCHECK_MESSAGE
  } catch (e) {
    return e.response.status === 401 && e.response.statusText === 'Unauthorized'
  }
}

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

(async () => {
  await testServiceReadiness()
})().catch(err => {
  console.error(err)
  throw err
});
