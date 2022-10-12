const { onExecutePostLogin: action } = require('./requireMfa')
const { runAction } = require('./test/utils')

describe('Action - Require MFA', () => {
  const clientWithRequireMfa = {
    metadata: {
      require_mfa: 'true',
    },
  }

  const userWithRequireMfa = {
    app_metadata: {
      require_mfa: true
    }
  }

  const userWithMfaDisabled = {
    app_metadata: {
      require_mfa: false
    }
  }

  const clientEmpty = {
    metadata: {},
  }

  const userEmpty = {
    app_metadata: {}
  }

  const authenticationWithIncompleteMfa = {
    methods: [],
  }

  const authenticationWithCompletedMfa = {
    methods: [{ name: 'mfa' }],
  }

  it('enables multifactor if requested in client metadata and mfa not completed', async () => {
    const api = await runAction(action, {
      client: clientWithRequireMfa,
      authentication: authenticationWithIncompleteMfa,
      user: userEmpty
    })

    expect(api.multifactor.enable).toHaveBeenCalledTimes(1)
    expect(api.multifactor.enable).toHaveBeenCalledWith('any', {
      allowRememberBrowser: false,
    })
  })

  it('enables multifactor if requested in user app metadata and mfa not completed', async () => {
    const api = await runAction(action, {
      client: clientEmpty,
      authentication: authenticationWithIncompleteMfa,
      user: userWithRequireMfa
    })

    expect(api.multifactor.enable).toHaveBeenCalledTimes(1)
    expect(api.multifactor.enable).toHaveBeenCalledWith('any', {
      allowRememberBrowser: false,
    })
  })

  it('enables multifactor if requested in client metadata and user app metadata and mfa not completed', async () => {
    const api = await runAction(action, {
      client: clientWithRequireMfa,
      authentication: authenticationWithIncompleteMfa,
      user: userWithRequireMfa
    })

    expect(api.multifactor.enable).toHaveBeenCalledTimes(1)
    expect(api.multifactor.enable).toHaveBeenCalledWith('any', {
      allowRememberBrowser: false,
    })
  })

  it('does not enable multifactor if requested in client metadata but explicitly disabled in user app metadata and mfa not completed', async () => {
    const api = await runAction(action, {
      client: clientWithRequireMfa,
      authentication: authenticationWithIncompleteMfa,
      user: userWithMfaDisabled
    })

    expect(api.multifactor.enable).not.toHaveBeenCalled()
  })

  it('does not enable multifactor if requested in client metadata and mfa completed', async () => {
    const api = await runAction(action, {
      client: clientWithRequireMfa,
      authentication: authenticationWithCompletedMfa,
      user: userEmpty
    })

    expect(api.multifactor.enable).not.toHaveBeenCalled()
  })

  it('does not enable multifactor if requested in user app metadata and mfa completed', async () => {
    const api = await runAction(action, {
      client: clientEmpty,
      authentication: authenticationWithCompletedMfa,
      user: userWithRequireMfa
    })

    expect(api.multifactor.enable).not.toHaveBeenCalled()
  })

  it('does not enable multifactor if not requested in client metadata nor user app metadata and mfa not completed', async () => {
    const api = await runAction(action, {
      client: clientEmpty,
      authentication: authenticationWithIncompleteMfa,
      user: userEmpty
    })

    expect(api.multifactor.enable).not.toHaveBeenCalled()
  })

  it('does not enable multifactor if no client metadata and no user app metadata and no authentication', async () => {
    const api = await runAction(action, {
      client: {},
      user: {}
    })

    expect(api.multifactor.enable).not.toHaveBeenCalled()
  })
})
