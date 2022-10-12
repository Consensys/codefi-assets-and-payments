import { M2mTokenModule } from '@codefi-assets-and-payments/auth'
import { ChainRegistryModule } from '@codefi-assets-and-payments/nestjs-orchestrate'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OperationEntity } from '../data/entities/OperationEntity'
import { TokenEntity } from '../data/entities/TokenEntity'
import { RecoveryService } from '../services/RecoveryService'
import { EventsModule } from './EventsModule'

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenEntity]),
    TypeOrmModule.forFeature([OperationEntity]),
    ChainRegistryModule,
    M2mTokenModule,
    EventsModule,
  ],
  providers: [RecoveryService],
  exports: [RecoveryService],
})
export class RecoveryModule {}
