/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  const Analytics = require('analytics-node')
  const analytics = new Analytics(event.secrets.SEGMENT_KEY, { flushAt: 1 })

  const analyticsTrack = async segmentEvent => {
    await analytics.track({
      userId: event.user.user_id,
      event: segmentEvent,
      properties: {
        client_name: event.client.name,
        client_id: event.client.client_id,
        connection: event.connection,
        login_count: event.stats.logins_count,
      },
      context: {
        userAgent: event.request.user_agent,
        ip: event.request.ip,
      },
    })
  }

  const analyticsIdentify = async () => {
    await analytics.identify({
      userId: event.user.user_id,
      traits: {
        email: event.user.email,
        signed_up: event.user.created_at,
        login_count: event.stats.logins_count,
      },
      context: {
        userAgent: event.request.user_agent,
        ip: event.request.ip,
      },
    })
  }

  const adminApps = event.secrets.ADMIN_APPS.split(',')

  // Check if application is eligible
  if (!adminApps.includes(event.client.name)) return

  const requestQueryPrompt = event.request.query
    ? event.request.query.prompt
    : undefined

  // Check if user is already authorized and didn't authenticate via a prompt
  if (requestQueryPrompt === 'none') {
    await analyticsTrack('Silent Account Login')
    // Check if this is the first time the user is logging AND it is not a silent login
  } else if (event.stats.logins_count === 1 && requestQueryPrompt !== 'none') {
    await analyticsTrack('Account Created')
    await analyticsIdentify()
  } else {
    await analyticsTrack('Account Login')
    await analyticsIdentify()
  }

  // Note: Set { flushAt: 1 } and use analytics.flush to ensure
  // the data is sent to Segment before the action terminates
  await analytics.flush()
}
