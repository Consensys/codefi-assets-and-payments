import { Module } from '@nestjs/common'
import { PersistentConfigurationService } from '../services/PersistentConfigurationService'
import { ContractRegistryModule } from '@codefi-assets-and-payments/nestjs-orchestrate'
import { M2mTokenModule } from '@codefi-assets-and-payments/auth'

@Module({
  imports: [ContractRegistryModule, M2mTokenModule],
  providers: [PersistentConfigurationService],
  exports: [PersistentConfigurationService],
})
export class PersistentConfigurationModule {}
