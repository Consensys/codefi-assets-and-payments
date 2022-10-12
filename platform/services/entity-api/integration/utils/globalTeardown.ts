import { stopNodeServer } from './server';

module.exports = async () => {
  if (process.env.INTEGRATION_TEST === 'true') {
    // await stopNodeServer()
  }
}
