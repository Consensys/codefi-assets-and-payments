import Axios from 'axios'
import axiosRetry from 'axios-retry'
import { API_BASE_URL } from './configs'
import { sleep } from '../../src/utils/sleep'

const waitForServer = async () => {
  const axiosInstance = Axios.create()
  axiosRetry(axiosInstance, {
    retries: 60,
    retryDelay: () => {
      return 1000
    },
  })
  await axiosInstance.get(API_BASE_URL)
  return
}

export const startNodeServer = async () => {
  console.log('Waiting for server to be ready')
  return new Promise<void>(async (resolve) => {
    await waitForServer()
    console.log('Server is ready')
    resolve()
  })
}
