import { startNodeServer } from './server'

module.exports = async () => {
  if (process.env.INTEGRATION_TEST === 'true') {
    console.log('integration tests global setup')
    await startNodeServer()
    console.log('integration tests global setup done')
  }
}
