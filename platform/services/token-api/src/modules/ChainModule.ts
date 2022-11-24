import {
  ChainRegistryModule,
  OrchestrateContractManagerModule,
} from '@consensys/nestjs-orchestrate'
import { Module } from '@nestjs/common'
import { ChainService } from '../services/ChainService'

@Module({
  imports: [OrchestrateContractManagerModule, ChainRegistryModule],
  providers: [ChainService],
  exports: [ChainService],
})
export class ChainModule {}
