import {
  ContractRegistryModule,
  OrchestrateContractManagerModule,
} from '@consensys/nestjs-orchestrate'
import { ApmModule } from '@consensys/observability'
import { Module } from '@nestjs/common'
import { ERC1400Token } from './ERC1400Token'
import { ERC721Token } from './ERC721Token'
import { DVPToken } from './DVP'
import { ERC20Token } from './ERC20Token'
import { UniversalToken } from './UniversalToken'

@Module({
  imports: [
    OrchestrateContractManagerModule,
    ContractRegistryModule,
    ApmModule  
  ],
  providers: [ERC20Token, ERC721Token, ERC1400Token, DVPToken, UniversalToken],
  exports: [ERC20Token, ERC721Token, ERC1400Token, DVPToken, UniversalToken],
})
export class TokensModule {}
