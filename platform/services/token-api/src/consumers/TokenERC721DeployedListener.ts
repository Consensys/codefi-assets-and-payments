import { Injectable } from '@nestjs/common'
import { AbstractTokenDeployedListener } from './AbstractTokenDeployedListener'
import { TokenType } from '@codefi-assets-and-payments/ts-types'

@Injectable()
export class TokenERC721DeployedListener extends AbstractTokenDeployedListener {
  eventName(): string {
    return 'CodefiERC721Deployed(string,string)'
  }

  tokenType(): TokenType {
    return TokenType.ERC721
  }
}
