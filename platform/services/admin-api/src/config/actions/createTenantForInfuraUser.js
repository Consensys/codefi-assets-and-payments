/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */

exports.onExecutePostLogin = async (event, api) => {
  if (event.connection.name !== event.secrets.INFURA_CONNECTION_NAME) {
    return
  }

  const axios = require('axios')
  const infuraUserId = event.user.user_id.replace('oauth2|Infura|', 'infura-')

  let accessTokenForEntityAPI
  try {
    const tokenResponse = await axios.post(
      `https://${event.secrets.AUTH0_TENANT_DOMAIN}/oauth/token`,
      {
        client_id: event.secrets.M2M_TOKEN_ADMIN_CLIENT_ID,
        client_secret: event.secrets.M2M_TOKEN_ADMIN_CLIENT_SECRET,
        audience: event.secrets.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
        grant_type: 'client_credentials',
      },
      {
        headers: {
          'content-type': 'application/json',
        },
      },
    )
    accessTokenForEntityAPI = tokenResponse.data.access_token
  } catch (error) {
    return api.access.deny(
      `Failed to get access token for entity API: ${error}`,
    )
  }

  let tenantExists = false
  try {
    const tenantCheckResponse = await axios.get(
      `${event.secrets.ENTITY_API_URL}/tenant/${infuraUserId}`,
      {
        headers: {
          Authorization: 'Bearer ' + accessTokenForEntityAPI,
        },
      },
    )
    tenantExists = tenantCheckResponse.status === 200
  } catch (error) {
    if (error.response.status !== 404) {
      return api.access.deny(
        `Could not check if tenant exists: ${JSON.stringify(error)}`,
      )
    }
  }

  if (!tenantExists) {
    try {
      const tenantCreationResponse = await axios.post(
        `${event.secrets.ENTITY_API_URL}/tenant`,
        {
          id: infuraUserId,
          name: infuraUserId,
          products: {
            assets: true,
            payments: false,
            compliance: false,
            staking: false,
            workflows: false,
          },
          defaultNetworkKey: 'mainnet',
          initialEntities: [
            {
              id: infuraUserId,
              name: infuraUserId,
            },
          ],
        },
        {
          headers: {
            Authorization: 'Bearer ' + accessTokenForEntityAPI,
          },
        },
      )
      if (tenantCreationResponse.status !== 201) {
        return api.access.deny(
          `Tenant creation failed with status ${tenantCreationResponse.status}`,
        )
      }
    } catch (error) {
      return api.access.deny(`Could not create tenant: ${error}`)
    }

    try {
      await api.user.setAppMetadata('tenantId', infuraUserId)
      await api.user.setAppMetadata(infuraUserId, {
        entityId: infuraUserId,
        roles: ['Tenant Admin', 'Wallet Owner'],
      })
    } catch (error) {
      console.log(error)
      return api.access.deny('Error registering tenantId')
    }
  }
}
