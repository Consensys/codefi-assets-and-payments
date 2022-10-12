import { OrchestrateAccountsModule } from '@codefi-assets-and-payments/nestjs-orchestrate'
import { Module } from '@nestjs/common'
import { AccountsController } from 'src/controllers/AccountsController'

@Module({
  imports: [OrchestrateAccountsModule],
  controllers: [AccountsController],
  providers: [],
  exports: [],
})
export class AccountsModule {}
