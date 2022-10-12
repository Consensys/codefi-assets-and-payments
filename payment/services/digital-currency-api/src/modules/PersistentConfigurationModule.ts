import { Module } from '@nestjs/common'
import { PersistentConfigurationService } from '../services/PersistentConfigurationService'
import { LegalEntityModule } from './LegalEntityModule'
import {
  ChainRegistryModule,
  OrchestrateAccountsModule,
} from '@codefi-assets-and-payments/nestjs-orchestrate'
import { M2mTokenModule } from '@codefi-assets-and-payments/auth'

@Module({
  imports: [
    LegalEntityModule,
    OrchestrateAccountsModule,
    ChainRegistryModule,
    M2mTokenModule,
  ],
  providers: [PersistentConfigurationService],
  exports: [PersistentConfigurationService],
})
export class PersistentConfigurationModule {}
