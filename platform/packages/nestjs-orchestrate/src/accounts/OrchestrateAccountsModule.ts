import { Module } from '@nestjs/common'
import { OrchestrateAccountsService } from './OrchestrateAccountsService'

@Module({
  providers: [OrchestrateAccountsService],
  exports: [OrchestrateAccountsService],
})
export class OrchestrateAccountsModule {}
