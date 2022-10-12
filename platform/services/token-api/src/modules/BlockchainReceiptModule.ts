import { Module } from '@nestjs/common'
import { EventsModule } from './EventsModule'
import { TokenERC20DeployedListener } from '../consumers/TokenERC20DeployedListener'
import { TokenERC721DeployedListener } from '../consumers/TokenERC721DeployedListener'
import { BlockchainReceiptConsumerListener } from '../consumers/BlockchainReceiptConsumerListener'
import { TokenModule } from './TokenModule'
import { OperationsModule } from './OperationsModule'
import { TokenTransferListener } from '../consumers/TokenTransferListener'
import { ChainModule } from './ChainModule'
import { M2mTokenModule } from '@codefi-assets-and-payments/auth'

@Module({
  imports: [
    EventsModule,
    TokenModule,
    OperationsModule,
    TokenModule,
    ChainModule,
    M2mTokenModule,
  ],
  providers: [
    BlockchainReceiptConsumerListener,
    TokenERC20DeployedListener,
    TokenERC721DeployedListener,
    TokenTransferListener,
  ],
})
export class BlockchainReceiptModule {}
