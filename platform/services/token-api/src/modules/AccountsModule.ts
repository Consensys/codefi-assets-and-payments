import { OrchestrateAccountsModule } from '@consensys/nestjs-orchestrate'
import { Module } from '@nestjs/common'
import { AccountsController } from 'src/controllers/AccountsController'

@Module({
  imports: [OrchestrateAccountsModule],
  controllers: [AccountsController],
  providers: [],
  exports: [],
})
export class AccountsModule {}
