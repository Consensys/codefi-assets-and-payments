/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  const adminApps = event.secrets.ADMIN_APPS.split(',')
  if (!adminApps.includes(event.client.name)) return

  const userMetadata = event.user.app_metadata || {}

  if (userMetadata.registered) {
    console.log('Found ID, user did not login for the first time')
    return
  }

  const axios = require('axios')

  let tokenResponse
  try {
    tokenResponse = await axios.post(event.secrets.TOKEN_ENDPOINT, {
      grant_type: 'client_credentials',
      client_id: event.secrets.HOOK_CLIENT_ID,
      client_secret: event.secrets.HOOK_CLIENT_SECRET,
      audience: event.secrets.API_AUDIENCE,
    })
  } catch (error) {
    console.log(error.message)
    return api.access.deny('Error registering user: ERR1')
  }

  const accessToken = tokenResponse.data
    ? tokenResponse.data.access_token
    : undefined

  let registerResponse
  try {
    registerResponse = await axios.post(
      `${event.secrets.USER_REGISTRATION_CALLBACK_URL}/auth/hook/register`,
      {
        ...event,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 15000,
      },
    )
  } catch (error) {
    console.log(error)
    return api.access.deny('Error registering user: ERR2')
  }

  if (!registerResponse || !registerResponse.data || !registerResponse.data.registered) {
    console.log('Registered property not present in body')
    console.log(registerResponse)
    return api.access.deny('Error registering user: ERR3')
  }

  try {
    await api.user.setAppMetadata('registered', registerResponse.data.registered)
  } catch (error) {
    console.log(error)
    return api.access.deny('Error registering user: ERR4')
  }
}
