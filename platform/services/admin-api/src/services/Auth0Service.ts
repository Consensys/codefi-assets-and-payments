import { ManagementClient, AuthenticationClient } from 'auth0'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import cfg from '../config'
import { M2mTokenService } from '@codefi-assets-and-payments/auth'
export interface Auth0ManagementClientOptions {
  clientId?: string
  clientSecret?: string
  grant_type?: string
  domain?: string
  audience?: string
}

export interface Auth0AuthenticationClientOptions {
  clientId?: string
  clientSecret?: string
  domain?: string
}

@Injectable()
export class Auth0Service {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly m2mTokenService: M2mTokenService,
  ) {}

  async getManagementClient(
    options: Auth0ManagementClientOptions = {},
  ): Promise<ManagementClient> {
    this.logger.info('Getting new management client instance')

    const clientId = options.clientId || cfg().auth0.clientId
    const clientSecret = options.clientSecret || cfg().auth0.clientSecret
    const audience = options.audience || cfg().auth0.audience
    const domain = options.domain || cfg().auth0.tenantDomain

    const token = await this.m2mTokenService.createM2mToken(
      clientId,
      clientSecret,
      audience,
    )

    return new ManagementClient({
      domain,
      token,
    })
  }

  getAuthenticationClient(
    options: Auth0AuthenticationClientOptions = {},
  ): AuthenticationClient {
    this.logger.info('Getting new authentication client instance')

    return new AuthenticationClient({
      clientId: options.clientId || cfg().auth0.clientId,
      clientSecret: options.clientSecret || cfg().auth0.clientSecret,
      domain: options.domain || cfg().auth0.tenantDomain,
    })
  }
}
