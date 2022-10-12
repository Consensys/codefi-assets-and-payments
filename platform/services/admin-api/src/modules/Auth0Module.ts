import { Module } from '@nestjs/common'
import { Auth0Service } from '../services/Auth0Service'
import { M2mTokenModule } from '@codefi-assets-and-payments/auth'

@Module({
  imports: [M2mTokenModule],
  controllers: [],
  providers: [Auth0Service],
  exports: [Auth0Service, M2mTokenModule],
})
export class Auth0Module {}
