import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { NestJSPinoLogger } from '@consensys/observability'
import { Repository } from 'typeorm'
import { DigitalCurrencyEntity } from '../data/entities/DigitalCurrencyEntity'
import { v4 as uuidv4 } from 'uuid'
import { LegalEntityService } from './LegalEntityService'
import { EventsService } from './EventsService'
import { OperationService } from './OperationService'
import {
  EntityNotFoundException,
  ProcessingMessageException,
  UnauthorizedException,
  ValidationException,
} from '@consensys/error-handler'
import { LegalEntityEntity } from '../data/entities/LegalEntityEntity'
import { OperationEntity } from '../data/entities/OperationEntity'
import { addHex, isGreaterOrEqualToHex } from '../utils/bignumberUtils'
import {
  EntityStatus,
  OperationType,
} from '@consensys/ts-types'
import { IEntityWallet } from '@consensys/messaging-events'
import { EthereumAddressService } from './EthereumAddressService'
import Web3 from 'web3'

@Injectable()
export class DigitalCurrencyService {
  constructor(
    private logger: NestJSPinoLogger,
    @InjectRepository(DigitalCurrencyEntity)
    private readonly digitalCurrencyRepository: Repository<DigitalCurrencyEntity>,
    private legalEntityService: LegalEntityService,
    private operationService: OperationService,
    private eventsService: EventsService,
    private ethereumAddressService: EthereumAddressService,
  ) {
    this.logger.setContext(DigitalCurrencyService.name)
  }

  async create(
    name: string,
    symbol: string,
    decimals: number,
    tenantId: string,
    subject: string,
    status: EntityStatus,
    entityId: string,
    ethereumAddress?: string,
  ): Promise<DigitalCurrencyEntity> {
    let wallet: IEntityWallet
    this.logger.info(
      `Creating digital currency. name=${name}, symbol=${symbol}, decimals=${decimals}, tenantId=${tenantId}, subject=${subject}, status=${status}, entityId=${entityId}`,
    )
    const userLegalEntity: LegalEntityEntity = await this.retrieveLegalEntity(
      tenantId,
      entityId,
    )
    // Checking if legal entity can act on behalf of address
    if (ethereumAddress) {
      wallet = await this.legalEntityOwnsEthereumAddress(
        ethereumAddress,
        userLegalEntity,
      )
    }

    const entityChainName = userLegalEntity.orchestrateChainName
    const entityEthereumAddress =
      wallet && wallet.address
        ? wallet.address
        : userLegalEntity.ethereumAddress

    const operationId = uuidv4()
    this.logger.info(
      `About to save entities and send command. operationId=${operationId}, entityChainName=${entityChainName}, entityEthereumAddress=${entityEthereumAddress}`,
    )

    const entity: DigitalCurrencyEntity = {
      id: uuidv4(),
      name,
      symbol,
      decimals,
      chainName: entityChainName,
      deployerAddress: entityEthereumAddress,
      createdBy: subject,
      tenantId,
      entityId,
      totalMinted: '0x0',
      totalBurnt: '0x0',
      status,
      operationId,
    }
    const result = await this.digitalCurrencyRepository.save(entity)

    await this.operationService.create(
      OperationType.Creation,
      EntityStatus.Pending,
      entityChainName,
      '0x0',
      entityEthereumAddress,
      operationId,
      tenantId,
      entityId,
      subject,
    )

    try {
      await this.eventsService.emitDeployTokenCommand(
        name,
        symbol,
        decimals,
        operationId,
        entityEthereumAddress,
        entityChainName,
        subject,
        tenantId,
        entityId,
      )
    } catch (error) {
      this.logger.error(
        `Failed to emit event. Setting operation ${operationId} as failed.`,
      )
      await this.operationService.update(
        { id: operationId },
        { status: EntityStatus.Failed },
      )

      throw error
    }

    return result
  }

  async mint(
    currencyId: string,
    amount: string,
    to: string,
    tenantId: string,
    subject: string,
    entityId: string,
    ethereumAddress?: string,
  ): Promise<string> {
    let wallet: IEntityWallet
    const userLegalEntity: LegalEntityEntity = await this.retrieveLegalEntity(
      tenantId,
      entityId,
    )
    // Checking if legal entity can act on behalf of address
    if (ethereumAddress) {
      wallet = await this.legalEntityOwnsEthereumAddress(
        ethereumAddress,
        userLegalEntity,
      )
    }

    const entityEthereumAddress =
      wallet && wallet.address
        ? wallet.address
        : userLegalEntity.ethereumAddress

    const currency = await this.findOneById(currencyId, tenantId)
    if (!currency.currencyEthereumAddress) {
      this.logger.error(
        `Cannot mint a currency with no ethereum address yet, currencyId=${currencyId}`,
      )
      throw new ProcessingMessageException(
        'CurrencyDoesNotHaveAddress',
        `Digital currency does not have ethereum address yet, currencyId=${currencyId}`,
        {
          currency,
          currencyId,
        },
      )
    }

    if (currency.deployerAddress !== entityEthereumAddress) {
      this.logger.error(
        `Cannot mint a currency if the user (address=${entityEthereumAddress}) is not the deployer (deployer=${currency.deployerAddress})`,
      )
      throw new UnauthorizedException(
        `MintUserIsNotDeployer`,
        `Cannot mint a currency if the user (address=${entityEthereumAddress}) is not the deployer (deployer=${currency.deployerAddress})`,
        {
          currency,
          userLegalEntity,
        },
      )
    }

    const operationId = uuidv4()

    this.logger.info(`About to create operation with id=${operationId} and `)
    await this.operationService.create(
      OperationType.Mint,
      EntityStatus.Pending,
      currency.chainName,
      amount,
      entityEthereumAddress,
      operationId,
      tenantId,
      entityId,
      subject,
      undefined,
      to,
      currency.currencyEthereumAddress,
    )

    try {
      await this.eventsService.emitMintTokenCommand(
        currency.currencyEthereumAddress,
        amount,
        to,
        operationId,
        entityEthereumAddress,
        currency.chainName,
        subject,
        tenantId,
        entityId,
      )
    } catch (error) {
      this.logger.error(
        `Failed to emit event. Setting operation ${operationId} as failed.`,
      )
      await this.operationService.update(
        { id: operationId },
        { status: EntityStatus.Failed },
      )

      throw error
    }

    return operationId
  }

  /**
   *
   * @param currencyId
   * @param amount
   * @param to
   * @param tenantId
   * @param subject
   * @param entityId
   * @param ethereumAddress
   */
  async transfer(
    currencyId: string,
    amount: string,
    to: string,
    tenantId: string,
    subject: string,
    entityId: string,
    ethereumAddress?: string,
  ): Promise<string> {
    let wallet: IEntityWallet
    this.logger.info(
      `Transfer request received, currencyId=${currencyId}, amount=${amount}, to=${to}, tenantId=${tenantId}, subject=${subject}, entityId=${entityId}`,
    )
    const userLegalEntity: LegalEntityEntity = await this.retrieveLegalEntity(
      tenantId,
      entityId,
    )
    // Checking if legal entity can act on behalf of address
    if (ethereumAddress) {
      wallet = await this.legalEntityOwnsEthereumAddress(
        ethereumAddress,
        userLegalEntity,
      )
    }

    const entityEthereumAddress =
      wallet && wallet.address
        ? wallet.address
        : userLegalEntity.ethereumAddress

    const currency: DigitalCurrencyEntity = await this.findOneById(
      currencyId,
      tenantId,
    )
    this.logger.info(
      `Found currency for id=${currencyId}, with address=${currency.currencyEthereumAddress}, chain=${currency.chainName}`,
    )

    const operationId = uuidv4()

    this.logger.info(`About to create operation with id=${operationId}`)
    const saved: OperationEntity = await this.operationService.create(
      OperationType.Transfer,
      EntityStatus.Pending,
      currency.chainName,
      amount,
      entityEthereumAddress,
      operationId,
      tenantId,
      entityId,
      subject,
      entityEthereumAddress,
      to,
      currency.currencyEthereumAddress,
    )

    this.logger.debug(saved, 'operation saved')

    try {
      await this.eventsService.emitTransferTokenCommand(
        currency.currencyEthereumAddress,
        amount,
        to,
        operationId,
        entityEthereumAddress,
        currency.chainName,
        subject,
        tenantId,
        entityId,
      )
    } catch (error) {
      this.logger.error(
        `Failed to emit event. Setting operation ${operationId} as failed.`,
      )
      await this.operationService.update(
        { id: operationId },
        { status: EntityStatus.Failed },
      )

      throw error
    }

    return operationId
  }

  async burn(
    currencyId: string,
    amount: string,
    tenantId: string,
    subject: string,
    entityId: string,
    ethereumAddress?: string,
  ): Promise<string> {
    let wallet: IEntityWallet
    this.logger.info(
      `Burn request received, currencyId=${currencyId}, amount=${amount}, tenantId=${tenantId}, subject=${subject}, entityId=${entityId}`,
    )
    const userLegalEntity: LegalEntityEntity = await this.retrieveLegalEntity(
      tenantId,
      entityId,
    )

    // Checking if legal entity can act on behalf of address
    if (ethereumAddress) {
      wallet = await this.legalEntityOwnsEthereumAddress(
        ethereumAddress,
        userLegalEntity,
      )
    }

    const entityEthereumAddress =
      wallet && wallet.address
        ? wallet.address
        : userLegalEntity.ethereumAddress

    const currency = await this.findOneById(currencyId, tenantId)
    if (!currency.currencyEthereumAddress) {
      this.logger.error(
        `Cannot burn a currency with no ethereum address yet, currencyId=${currencyId}`,
      )
      throw new ProcessingMessageException(
        'CurrencyDoesNotHaveAddress',
        `Digital currency does not have ethereum address yet, currencyId=${currencyId}`,
        {
          currency,
          currencyId,
        },
      )
    }

    const operationId = uuidv4()

    this.logger.info(`About to create operation with id=${operationId} and `)
    await this.operationService.create(
      OperationType.Burn,
      EntityStatus.Pending,
      currency.chainName,
      amount,
      entityEthereumAddress,
      operationId,
      tenantId,
      entityId,
      subject,
      entityEthereumAddress,
      undefined,
      currency.currencyEthereumAddress,
    )

    try {
      await this.eventsService.emitBurnTokenCommand(
        currency.currencyEthereumAddress,
        amount,
        operationId,
        entityEthereumAddress,
        currency.chainName,
        subject,
        tenantId,
        entityId,
      )
    } catch (error) {
      this.logger.error(
        `Failed to emit event. Setting operation ${operationId} as failed.`,
      )
      await this.operationService.update(
        { id: operationId },
        { status: EntityStatus.Failed },
      )

      throw error
    }

    return operationId
  }

  async save(
    name: string,
    symbol: string,
    decimals: number,
    status: EntityStatus,
    currencyEthereumAddress: string,
    deployerAddress: string,
    chainName: string,
    tenantId?: string,
    entityId?: string,
  ): Promise<DigitalCurrencyEntity> {
    const entity: DigitalCurrencyEntity = {
      id: uuidv4(),
      name,
      symbol,
      status,
      currencyEthereumAddress,
      deployerAddress,
      decimals,
      tenantId,
      chainName,
      totalMinted: '0x0',
      totalBurnt: '0x0',
      createdAt: new Date(),
      entityId,
    }

    const result = await this.digitalCurrencyRepository.save(entity)
    return result
  }

  // We don't have a generic `Partial<DigitalCurrencyEntity> params`
  // to avoid mistakes, there are only 3 ways to identify a digital currency:
  // * id
  // * <currencyEthereumAddress,chainName>
  // * operationId
  async findOneById(
    id: string,
    tenantId: string,
  ): Promise<DigitalCurrencyEntity> {
    const currency = await this.digitalCurrencyRepository.findOne({
      id,
      tenantId,
    })
    if (!currency) {
      throw new EntityNotFoundException(
        `DigitalCurrencyNotFound`,
        `Digital currency not found id=${id} and tenantId=${tenantId}`,
        { id, tenantId },
      )
    }
    return currency
  }

  // We don't have a generic `Partial<DigitalCurrencyEntity> params`
  // to avoid mistakes, there are only 3 ways to identify a digital currency:
  // * id
  // * <currencyEthereumAddress,chainName>
  // * operationId
  async findOneByAddressAndChainName(
    currencyEthereumAddress: string,
    chainName: string,
  ): Promise<DigitalCurrencyEntity> {
    const currency = await this.digitalCurrencyRepository.findOne({
      currencyEthereumAddress,
      chainName,
    })
    return currency
  }

  async findAll(tenantId: string): Promise<DigitalCurrencyEntity[]> {
    const currency = await this.digitalCurrencyRepository.find({
      where: { tenantId },
      order: {
        createdAt: 'DESC',
      },
    })
    return currency
  }

  // We don't have a generic `Partial<DigitalCurrencyEntity> params`
  // to avoid mistakes, there are only 3 ways to identify a digital currency:
  // * id
  // * <currencyEthereumAddress,chainName>
  // * operationId
  async updateByOperationId(
    operationId: string,
    update: Partial<DigitalCurrencyEntity>,
  ): Promise<number> {
    const result = await this.digitalCurrencyRepository.update(
      {
        operationId,
      },
      update,
    )
    return result.affected
  }

  // We don't have a generic `Partial<DigitalCurrencyEntity> params`
  // to avoid mistakes, there are only 3 ways to identify a digital currency:
  // * id
  // * <currencyEthereumAddress,chainName>
  // * operationId
  async updateById(
    id: string,
    update: Partial<DigitalCurrencyEntity>,
  ): Promise<number> {
    const result = await this.digitalCurrencyRepository.update(
      {
        id,
      },
      update,
    )
    return result.affected
  }

  async computeOperation(operation: OperationEntity) {
    this.logger.info(
      `DigitalCurrencyService compute operation, id=${operation.id}, type=${operation.operationType}`,
    )
    if (operation.operationType === OperationType.Mint) {
      this.logger.info(
        `Operation of type MINT. Finding currency, digitalCurrencyAddress=${operation.digitalCurrencyAddress}, chainName=${operation.chainName}`,
      )
      const currency = await this.findOneByAddressAndChainName(
        operation.digitalCurrencyAddress,
        operation.chainName,
      )
      if (!currency) {
        this.logger.info(`Currency not found. Skipping operation.`)
        return
      }
      this.logger.info(`Currency found, id=${currency.id}`)
      const totalNewMinted = addHex(
        currency.totalMinted,
        operation.operationAmount,
      )

      this.logger.info(
        `Currency with id=${currency.id}, minted=${currency.totalMinted}, operation amount=${operation.operationAmount}, totalNewMinted=${totalNewMinted}`,
      )
      await this.updateById(currency.id, {
        totalMinted: totalNewMinted,
      })
    }

    if (operation.operationType === OperationType.Burn) {
      this.logger.info(
        `Operation of type BURN. Finding currency, digitalCurrencyAddress=${operation.digitalCurrencyAddress}, chainName=${operation.chainName}`,
      )
      const currency = await this.findOneByAddressAndChainName(
        operation.digitalCurrencyAddress,
        operation.chainName,
      )
      if (!currency) {
        this.logger.info(`Currency not found. Skipping operation.`)
        return
      }
      this.logger.info(`Currency found, id=${currency.id}`)
      const totalNewBurnt = addHex(
        currency.totalBurnt,
        operation.operationAmount,
      )

      this.logger.info(
        `Currency with id=${currency.id}, currently burnt=${currency.totalBurnt}, operation amount=${operation.operationAmount}, totalNewBurnt=${totalNewBurnt}`,
      )
      await this.updateById(currency.id, {
        totalBurnt: totalNewBurnt,
      })
    }
  }

  private async retrieveLegalEntity(
    tenantId: string,
    entityId: string,
  ): Promise<LegalEntityEntity> {
    const userLegalEntity = await this.legalEntityService.findOne({
      id: entityId,
      tenantId,
    })

    if (!userLegalEntity) {
      throw new UnauthorizedException(
        `UserTenantNotExist`,
        `Entity id=${entityId} not registered for tenantId=${tenantId}`,
        {
          tenantId,
          entityId,
        },
      )
    }
    return userLegalEntity
  }

  private async legalEntityOwnsEthereumAddress(
    address: string,
    userLegalEntity: LegalEntityEntity,
  ): Promise<IEntityWallet> {
    this.logger.info(
      `Checking if legal entity=${userLegalEntity.id} can act on behalf of ethereum address=${address}`,
    )

    const ethereumAddress = await this.ethereumAddressService.findOne({
      address: Web3.utils.toChecksumAddress(address),
    })

    if (!ethereumAddress) {
      this.logger.error(
        `Legal entity=${userLegalEntity.id} can't act on behalf of ethereum address=${address}`,
      )
      throw new UnauthorizedException(
        `UserCantActOnAddress`,
        `Entity id=${userLegalEntity.id} can't act on behalf of ethereum address=${address}`,
        {
          legalEntityId: userLegalEntity.id,
          ethereumAddress,
        },
      )
    }
    this.logger.info(
      `Entity ${userLegalEntity.id} can act on behalf of ${address}`,
    )
    return {
      address: ethereumAddress.address,
      metadata: ethereumAddress.metadata,
      type: ethereumAddress.type,
    }
  }
}
