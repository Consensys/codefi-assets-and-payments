import { Module } from '@nestjs/common'
import { AsyncOperationResultConsumer } from '../consumers/AsyncOperationResultConsumer'
import { DigitalCurrencyModule } from './DigitalCurrencyModule'
import { HolderModule } from './HolderModule'
import { LegalEntityModule } from './LegalEntityModule'
import { OperationsModule } from './OperationsModule'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WalletOperationEventConsumer } from '../consumers/WalletOperationEventConsumer'
import { LegalEntityEntity } from '../data/entities/LegalEntityEntity'
import { TenantOperationEventConsumer } from '../consumers/TenantOperationEventConsumer'
import { EntityOperationEventConsumer } from '../consumers/EntityOperationEventConsumer'
import { ChainRegistryModule } from '@codefi-assets-and-payments/nestjs-orchestrate'
import { M2mTokenModule } from '@codefi-assets-and-payments/auth'

@Module({
  imports: [
    OperationsModule,
    DigitalCurrencyModule,
    LegalEntityModule,
    HolderModule,
    ChainRegistryModule,
    TypeOrmModule.forFeature([LegalEntityEntity]),
    M2mTokenModule,
  ],
  providers: [
    AsyncOperationResultConsumer,
    WalletOperationEventConsumer,
    EntityOperationEventConsumer,
    TenantOperationEventConsumer,
  ],
})
export class ConsumersModule {}
