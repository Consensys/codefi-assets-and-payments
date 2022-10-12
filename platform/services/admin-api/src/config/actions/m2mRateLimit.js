/**
 * Handler that will be called during the execution of a Client Credentials exchange.
 *
 * @param {Event} event - Details about client credentials grant request.
 * @param {CredentialsExchangeAPI} api - Interface whose methods can be used to change the behavior of client credentials grant.
 */
exports.onExecuteCredentialsExchange = async (event, api) => {
  const exemptTenants = event.secrets.DISABLE_RATE_LIMIT_TENANTS.split(',')
  if (exemptTenants.includes(event.tenant.id)) return

  const redis = require('redis')
  const redisClient = redis.createClient({
    socket: {
      host: event.secrets.REDIS_HOST,
      port: 6379,
    },
    password: event.secrets.REDIS_PASS,
  })

  await redisClient.connect()

  const redisKey = `${event.client.client_id}-limiter`

  console.log('Performing redis query')

  // Based on python code from https://developer.redis.com/howtos/ratelimiting/
  try {
    await redisClient.set(
      redisKey,
      parseInt(event.secrets.RATE_LIMIT_MAX_ATTEMPTS),
      {
        EX: parseInt(event.secrets.RATE_LIMIT_PERIOD_IN_SECONDS),
        NX: true,
      },
    )
  } catch (error) {
    console.log('Error setting new redis cache entry with expiry')
    console.log(error)
    return api.access.deny(
      'server_error',
      'Error checking token rate limit: ERR1',
    )
  }

  try {
    const attemptsLeft = await redisClient.get(redisKey)

    if (parseInt(attemptsLeft) <= 0) {
      return api.access.deny(
        'invalid_request',
        `Rate limit of ${event.secrets.RATE_LIMIT_MAX_ATTEMPTS} in ${event.secrets.RATE_LIMIT_PERIOD_IN_SECONDS} seconds reached`,
      )
    }
  } catch (error) {
    console.log('Error retrieving redis cache entry')
    console.log(error)
    return api.access.deny(
      'server_error',
      'Error checking token rate limit: ERR2',
    )
  }

  try {
    await redisClient.decr(redisKey)
  } catch (error) {
    console.log('Error decreasing redis cache entry')
    console.log(error)
    return api.access.deny(
      'server_error',
      'Error checking token rate limit: ERR3',
    )
  }

  console.log('Auth successful')
}
