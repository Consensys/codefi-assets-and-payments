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
  console.log(`Starting node server`)
  return new Promise<void>(async resolve => {
    await sleep(5000)
    console.log('docker compose starting')
    await waitForServer()
    console.log('Server is ready')
    resolve()
  })
}
