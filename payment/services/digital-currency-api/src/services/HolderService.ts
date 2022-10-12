import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import Web3 from 'web3'
import { ethers as Ethers } from 'ethers'
import { M2mTokenService } from '@codefi-assets-and-payments/auth'
import {
  ChainRegistry,
  ContractRegistry,
} from '@codefi-assets-and-payments/nestjs-orchestrate'
import config from '../config'
import { EntityNotFoundException } from '@codefi-assets-and-payments/error-handler'
import { stringToHex } from '../utils/bignumberUtils'
import { DigitalCurrencyService } from './DigitalCurrencyService'
import { EntityStatus } from '@codefi-assets-and-payments/ts-types'

@Injectable()
export class HolderService {
  constructor(
    private logger: NestJSPinoLogger,
    private readonly m2mService: M2mTokenService,
    private readonly orchestrateChainRegistry: ChainRegistry,
    private readonly contractRegistry: ContractRegistry,
    private readonly digitalCurrencyService: DigitalCurrencyService,
  ) {
    this.logger.setContext(HolderService.name)
  }
  public readonly ERC20_CONTRACT_NAME = 'CodefiERC20'

  async findBalance(
    ethereumAddress: string,
    currencyEthereumAddress: string,
    chainName: string,
  ): Promise<string> {
    this.logger.info(
      `find balance from ${ethereumAddress} and currency ${currencyEthereumAddress}`,
    )

    const currency =
      await this.digitalCurrencyService.findOneByAddressAndChainName(
        currencyEthereumAddress,
        chainName,
      )

    if (!currency || currency.status !== EntityStatus.Confirmed) {
      this.logger.warn(`Digital Currency does not exist or is not mined.`)
      throw new EntityNotFoundException(
        `DigitalCurrencyNotFound`,
        `Digital currency not found`,
        { currencyEthereumAddress, chainName },
      )
    }

    const authToken = await this.m2mService.createM2mToken(
      config().m2mToken.client.id,
      config().m2mToken.client.secret,
      config().m2mToken.audience,
    )
    this.logger.info(`search if chain ${chainName} exists`)
    const registeredChains: any[] =
      await this.orchestrateChainRegistry.getAllChains(authToken)

    const existingChain = registeredChains.find((chain) =>
      chain.name.includes(chainName),
    )

    if (!existingChain) {
      this.logger.warn(`Chain is not registered for provided name=${chainName}`)
      throw new EntityNotFoundException(
        `ChainNotFound`,
        `Chain is not registered for provided name=${chainName}`,
        { chainName },
      )
    }

    // get contract abi
    const existingContract =
      await this.contractRegistry.getContractByContractName(
        this.ERC20_CONTRACT_NAME,
        authToken,
      )

    if (!existingContract) {
      this.logger.error(
        `Contract ${this.ERC20_CONTRACT_NAME} is not registered`,
      )
      return '0x0'
    }

    const ethers = this.getProvider(existingChain.urls[0])

    const contract = new Ethers.Contract(
      Web3.utils.toChecksumAddress(currencyEthereumAddress),
      existingContract.abi,
      ethers,
    )

    this.logger.info(`Calling the contract`)

    const balance = await contract.callStatic.balanceOf(
      Web3.utils.toChecksumAddress(ethereumAddress),
    )

    return balance ? balance.toHexString() : '0x0'
  }

  private getProvider(url: string): Ethers.providers.JsonRpcProvider {
    const matches = url.match(/(.+):\/\/(.+):(.+)@(.+)/)

    if (matches) {
      const url = matches[1] + '://' + matches[4]
      const user = matches[2]
      const password = matches[3]
      return new Ethers.providers.JsonRpcProvider({ url, user, password })
    }

    return new Ethers.providers.JsonRpcProvider(url)
  }
}
