import {
  ContractManager,
  TransactionConfig,
  IHeaders,
} from '@codefi-assets-and-payments/nestjs-orchestrate'
import { Injectable } from '@nestjs/common'

export enum Standard {
  Undefined,
  HoldableERC20,
  HoldableERC1400,
}

@Injectable()
export class DVPToken {
  public static readonly DVP_CONTRACT_NAME = 'DVPToken'

  constructor(private contractManager: ContractManager) {}

  async create(
    owned: boolean,
    escrowForbidden: boolean,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    return this.contractManager.deploy(
      DVPToken.DVP_CONTRACT_NAME,
      config,
      [owned, escrowForbidden],
      'constructor(bool,bool)',
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async executeHolds(
    tokenOne: string,
    tokenOneHoldId: string,
    tokenStandardOne: Standard,
    tokenTwo: string,
    tokenTwoHoldId: string,
    tokenStandardTwo: Standard,
    preImage: string,
    tokenOneRecipient: string,
    tokenTwoRecipient: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    return this.contractManager.exec(
      DVPToken.DVP_CONTRACT_NAME,
      'executeHolds(address, bytes32, Standard, address, bytes32, Standard, bytes32, address, address)',
      config,
      [
        tokenOne,
        tokenOneHoldId,
        tokenStandardOne,
        tokenTwo,
        tokenTwoHoldId,
        tokenStandardTwo,
        preImage,
        tokenOneRecipient,
        tokenTwoRecipient,
      ],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  // view

  async controllers(
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string[]> {
    return this.contractManager.call(
      DVPToken.DVP_CONTRACT_NAME,
      config,
      'controllers()',
      contractAddress,
      [],
      authToken,
      headers,
    )
  }
}
