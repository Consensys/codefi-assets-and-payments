import { Module } from '@nestjs/common'
import { MintTokenCommandConsumer } from '../commands/MintTokenCommandConsumer'
import { DeployTokenCommandConsumer } from '../commands/DeployTokenCommandConsumer'
import { TokensController } from '../controllers/TokensController'
import { TokensManagerService } from '../services/TokensManagerService'
import { EventsModule } from './EventsModule'
import { ERC20Service } from '../services/ERC20Service'
import { ERC721Service } from '../services/ERC721Service'
import { OperationsModule } from './OperationsModule'
import { TokenModule } from './TokenModule'
import { TokensModule } from '@consensys/tokens'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OperationEntity } from '../data/entities/OperationEntity'
import { TokenEntity } from '../data/entities/TokenEntity'
import config from '../config'
import { BlockchainReceiptModule } from './BlockchainReceiptModule'
import { TransferTokenCommandConsumer } from '../commands/TransferTokenCommandConsumer'
import { BurnTokenCommandConsumer } from '../commands/BurnTokenCommandConsumer'
import { M2mTokenModule } from '@consensys/auth'
import { ExecTokenCommandConsumer } from '../commands/ExecTokenCommandConsumer'
import { SetTokenURICommandConsumer } from '../commands/SetTokenURICommandConsumer'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...config().db,
      entities: [OperationEntity, TokenEntity],
    }),
    TokenModule,
    TokensModule,
    OperationsModule,
    EventsModule,
    BlockchainReceiptModule,
    M2mTokenModule,
  ],
  controllers: [TokensController],
  providers: [
    ERC20Service,
    ERC721Service,
    TokensManagerService,
    DeployTokenCommandConsumer,
    MintTokenCommandConsumer,
    TransferTokenCommandConsumer,
    BurnTokenCommandConsumer,
    ExecTokenCommandConsumer,
    SetTokenURICommandConsumer,
  ],
  exports: [TokensManagerService],
})
export class TokensManagerModule {}
