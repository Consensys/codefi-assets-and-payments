import { Module } from '@nestjs/common'
import { LoggerModule } from '@consensys/observability'
import { TypeOrmModule } from '@nestjs/typeorm'
import ormconfig from '../ormconfig'
import { nestjsLoggerModuleConfig } from '@consensys/observability'
import { KafkaConsumerModule, KafkaPreview } from '@consensys/nestjs-messaging'
import { TenantEntity } from '../data/entities/TenantEntity'
import { EntityEntity } from '../data/entities/EntityEntity'
import { WalletEntity } from '../data/entities/WalletEntity'
import { RecoveryService } from '../services/RecoveryService'
import { TenantOperationEventConsumer } from '../consumers/TenantOperationEventConsumer'
import { EntityOperationEventConsumer } from '../consumers/EntityOperationEventConsumer'
import { WalletOperationEventConsumer } from '../consumers/WalletOperationEventConsumer'

const imports = [
  LoggerModule.forRoot(nestjsLoggerModuleConfig()),
  TypeOrmModule.forRoot(ormconfig),
  KafkaConsumerModule,
  TypeOrmModule.forFeature([TenantEntity, EntityEntity, WalletEntity]),
  KafkaPreview.CodefiConsumerModule,
]

@Module({
  imports,
  controllers: [],
  providers: [
    RecoveryService,
    TenantOperationEventConsumer,
    EntityOperationEventConsumer,
    WalletOperationEventConsumer,
  ],
})
export class RecoveryModule {}
