/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  const clientMetadata = event.client.metadata || {}
  const authentication = event.authentication || { methods: [] }
  const userAppMetadata = event.user.app_metadata || {};
  const clientRequireMfa = clientMetadata.require_mfa
  const userRequireMfa = userAppMetadata.require_mfa

  // Check if MFA is disabled at user level
  if (userRequireMfa === false) return

  /* You can trigger MFA conditionally by checking:
    1. Client Metadata: event.client.metadata.require_mfa
    2. User App Metadata: event.user.app_metadata.mfa_enabled */
  if (clientRequireMfa !== 'true' && !userRequireMfa) return

  // Silent authentication support for MFA
  // See https://auth0.com/docs/authenticate/login/configure-silent-authentication#silent-authentication-with-multi-factor-authentication for more details

  const completedMfa = !!authentication.methods.find(
    method => method.name === 'mfa',
  )
  if (completedMfa) return

  api.multifactor.enable('any', {
    // Optional, defaults to true. Set to false to force authentication every time
    // See https://auth0.com/docs/multifactor-authentication/custom#change-the-frequency-of-authentication-requests for details
    allowRememberBrowser: false,
  })
}
