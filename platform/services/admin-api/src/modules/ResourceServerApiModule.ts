import { Module } from '@nestjs/common'
import { ResourceServerApiController } from '../controllers/ResourceServerApiController'
import { Auth0Service } from '../services/Auth0Service'
import { ResourceServerApiService } from '../services/ResourceServerApiService'
import { Auth0Module } from './Auth0Module'

@Module({
  imports: [Auth0Module],
  controllers: [ResourceServerApiController],
  providers: [ResourceServerApiService, Auth0Service],
  exports: [ResourceServerApiService],
})
export class ResourceServerApiModule {}
