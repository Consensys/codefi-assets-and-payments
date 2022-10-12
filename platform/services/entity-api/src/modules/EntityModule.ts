import { Module } from '@nestjs/common'
import { WalletController } from '../controllers/WalletController'
import { WalletService } from '../services/WalletService'
import { OrchestrateAccountsModule } from '@codefi-assets-and-payments/nestjs-orchestrate'
import { WalletEntity } from '../data/entities/WalletEntity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EntityEntity } from '../data/entities/EntityEntity'
import { EntityService } from '../services/EntityService'
import { EntityController } from '../controllers/EntityController'
import { KafkaProducerModule } from '@codefi-assets-and-payments/nestjs-messaging'
import { AdminApiService } from '../services/AdminApiService'
import { M2mTokenModule } from '@codefi-assets-and-payments/auth'
import { StoreService } from '../services/StoreService'
import { TenantStoreEntity } from '../data/entities/TenantStoreEntity'
import { EntityStoreEntity } from '../data/entities/EntityStoreEntity'
import { StoreConfigService } from '../services/StoreConfigService'
import { EntityClientController } from '../controllers/EntityClientController'
import { ClientService } from '../services/ClientService'
import { TenantEntity } from '../data/entities/TenantEntity'
import { ClientEntity } from '../data/entities/ClientEntity'

@Module({
  imports: [
    M2mTokenModule,
    TypeOrmModule.forFeature([
      TenantEntity,
      EntityEntity,
      WalletEntity,
      TenantStoreEntity,
      EntityStoreEntity,
      ClientEntity,
    ]),
    OrchestrateAccountsModule,
    KafkaProducerModule,
  ],
  controllers: [EntityController, WalletController, EntityClientController],
  providers: [
    EntityService,
    WalletService,
    AdminApiService,
    StoreService,
    StoreConfigService,
    ClientService,
  ],
  exports: [EntityService, WalletService],
})
export class EntityModule {}
