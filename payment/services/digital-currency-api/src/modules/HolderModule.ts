import { M2mTokenModule } from '@consensys/auth'
import {
  ChainRegistryModule,
  ContractRegistryModule,
} from '@consensys/nestjs-orchestrate'
import { Module } from '@nestjs/common'
import { HolderController } from '../controllers/HolderController'
import { HolderService } from '../services/HolderService'
import { DigitalCurrencyModule } from './DigitalCurrencyModule'

@Module({
  imports: [
    M2mTokenModule,
    ChainRegistryModule,
    ContractRegistryModule,
    DigitalCurrencyModule,
  ],
  providers: [HolderService],
  exports: [HolderService],
  controllers: [HolderController],
})
export class HolderModule {}
