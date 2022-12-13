import { Module } from '@nestjs/common'
import { PersistentConfigurationService } from '../services/PersistentConfigurationService'
import { ContractRegistryModule } from '@consensys/nestjs-orchestrate'
import { M2mTokenModule } from '@consensys/auth'

@Module({
  imports: [ContractRegistryModule, M2mTokenModule],
  providers: [PersistentConfigurationService],
  exports: [PersistentConfigurationService],
})
export class PersistentConfigurationModule {}
