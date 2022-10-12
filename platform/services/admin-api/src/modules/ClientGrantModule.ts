import { Module } from '@nestjs/common'
import { ClientGrantController } from '../controllers/ClientGrantController'
import { Auth0Service } from '../services/Auth0Service'
import { Auth0Module } from './Auth0Module'
import { ClientGrantService } from '../services/ClientGrantService'

@Module({
  imports: [Auth0Module],
  controllers: [ClientGrantController],
  providers: [ClientGrantService, Auth0Service],
  exports: [ClientGrantService],
})
export class ClientGrantModule {}
