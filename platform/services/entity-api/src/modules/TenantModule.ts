import { KafkaProducerModule } from '@codefi-assets-and-payments/nestjs-messaging'
import { OrchestrateAccountsModule } from '@codefi-assets-and-payments/nestjs-orchestrate'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TenantStoreEntity } from '../data/entities/TenantStoreEntity'
import { StoreService } from '../services/StoreService'
import { TenantController } from '../controllers/TenantController'
import { TenantEntity } from '../data/entities/TenantEntity'
import { AdminApiService } from '../services/AdminApiService'
import { TenantService } from '../services/TenantService'
import { EntityModule } from './EntityModule'
import { EntityStoreEntity } from '../data/entities/EntityStoreEntity'
import { StoreConfigService } from '../services/StoreConfigService'
import { TenantClientController } from '../controllers/TenantClientController'
import { ClientEntity } from '../data/entities/ClientEntity'
import { ClientService } from '../services/ClientService'
import { EntityEntity } from '../data/entities/EntityEntity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TenantEntity,
      EntityEntity,
      TenantStoreEntity,
      EntityStoreEntity,
      ClientEntity,
    ]),
    KafkaProducerModule,
    OrchestrateAccountsModule,
    EntityModule,
  ],
  controllers: [TenantController, TenantClientController],
  providers: [
    TenantService,
    AdminApiService,
    StoreService,
    StoreConfigService,
    ClientService,
  ],
  exports: [TenantService, ClientService],
})
export class TenantModule {}
