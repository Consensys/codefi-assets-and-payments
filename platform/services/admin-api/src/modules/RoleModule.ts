import { Module } from '@nestjs/common'
import { Auth0Module } from './Auth0Module'
import { RoleController } from '../controllers/RoleController'
import { RoleService } from '../services/RoleService'

@Module({
  imports: [Auth0Module],
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule {}
