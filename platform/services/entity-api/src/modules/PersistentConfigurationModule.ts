import { Module } from '@nestjs/common'
import { PersistentConfigurationService } from '../services/PersistentConfigurationService'
import { TenantModule } from './TenantModule'
import { EntityModule } from './EntityModule'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TenantEntity } from '../data/entities/TenantEntity'
import { EntityEntity } from '../data/entities/EntityEntity'
import { WalletEntity } from '../data/entities/WalletEntity'

@Module({
  imports: [
    TenantModule,
    EntityModule,
    TypeOrmModule.forFeature([TenantEntity, EntityEntity, WalletEntity]),
  ],
  providers: [PersistentConfigurationService],
  exports: [PersistentConfigurationService],
})
export class PersistentConfigurationModule {}
