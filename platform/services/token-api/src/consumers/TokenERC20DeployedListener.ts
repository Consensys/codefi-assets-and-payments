import { Injectable } from '@nestjs/common'
import { AbstractTokenDeployedListener } from './AbstractTokenDeployedListener'
import { TokenType } from '@consensys/ts-types'

@Injectable()
export class TokenERC20DeployedListener extends AbstractTokenDeployedListener {
  eventName(): string {
    return 'CodefiERC20Deployed(string,string,uint8)'
  }

  tokenType(): TokenType {
    return TokenType.ERC20
  }
}
