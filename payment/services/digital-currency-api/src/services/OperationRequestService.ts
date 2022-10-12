import { InjectRepository } from '@nestjs/typeorm'
import { OperationRequestEntity } from '../data/entities/OperationRequestEntity'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { Injectable } from '@nestjs/common'
import { Repository, UpdateResult } from 'typeorm'
import { OperationEntity } from '../data/entities/OperationEntity'
import { DigitalCurrencyEntity } from '../data/entities/DigitalCurrencyEntity'
import { DigitalCurrencyService } from './DigitalCurrencyService'
import BigNumber from 'bignumber.js'
import {
  BadRequestException,
  EntityNotFoundException,
  ValidationException,
} from '@codefi-assets-and-payments/error-handler'
import { v4 as uuidv4 } from 'uuid'
import { KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
import {
  EntityStatus,
  AquisitionRedeemRequest,
  OperationRequestState,
  OperationRequestType,
} from '@codefi-assets-and-payments/ts-types'
import { hexToString } from '../utils/bignumberUtils'
import { LegalEntityService } from './LegalEntityService'
import { LegalEntityEntity } from '../data/entities/LegalEntityEntity'
import { Counted } from './types'

/**
 *
 */
@Injectable()
export class OperationRequestService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(OperationRequestEntity)
    private readonly operationRequestRepo: Repository<OperationRequestEntity>,
    @InjectRepository(DigitalCurrencyEntity)
    private readonly digitalCurrencyRepo: Repository<DigitalCurrencyEntity>,
    private readonly digitalCurrencyService: DigitalCurrencyService,
    @InjectRepository(OperationEntity)
    private readonly operationRepo: Repository<OperationEntity>,
    private readonly kafkaProducer: KafkaProducer,
    private readonly legalEntityService: LegalEntityService,
  ) {}

  /**
   *
   * @param id
   * @returns
   */
  async hasRequest(id: string): Promise<boolean> {
    return !!(await this.operationRequestRepo.findOne(id))
  }

  /**
   *  Create a operation request for the issuer
   *
   *
   * @param operationTypeRequest - {@see OperationRequestType}
   * @param requester - @type ethereum address
   * @param amount - @type hex string
   * @param issuer - @type ethereum address
   * @param tokenId  - @type uuid
   */
  async createPendingRequest(
    operationTypeRequest: OperationRequestType,
    requester: string,
    amount: string,
    issuer: string,
    tokenId: string,
    tenantId: string,
    entityId: string,
    subject: string,
  ): Promise<OperationRequestEntity> {
    const currencyToken = await this.digitalCurrencyRepo.findOne({
      id: tokenId,
    })
    if (!currencyToken) {
      throw new EntityNotFoundException(
        `DigitalCurrencyNotFound`,
        `currency=${tokenId} not found`,
        {
          tokenId,
        },
      )
    }

    const legalEntity: LegalEntityEntity =
      await this.legalEntityService.findOne({
        id: entityId,
        tenantId,
      })

    if (!legalEntity) {
      throw new EntityNotFoundException(
        `LegalEntityNotFound`,
        `Entity with id=${entityId}, tenantId=${tenantId} not found`,
        {
          entityId,
          tenantId,
        },
      )
    }

    const newOperationRequest: OperationRequestEntity = {
      id: uuidv4(),
      type: operationTypeRequest,
      amount,
      issuer,
      requester,
      state: OperationRequestState.PENDING,
      symbol: currencyToken.symbol,
      chainName: currencyToken.chainName,
      tokenAddress: currencyToken.currencyEthereumAddress,
      tenantId,
      subject,
    }

    if (operationTypeRequest == OperationRequestType.REDEEM) {
      const transferOperationId = await this.digitalCurrencyService.transfer(
        tokenId,
        amount,
        issuer,
        tenantId,
        subject,
        entityId,
        legalEntity.ethereumAddress !== requester ? requester : undefined,
      )
      newOperationRequest.preRequirementOperationId = transferOperationId
    }

    const saved: OperationRequestEntity = await this.operationRequestRepo.save(
      newOperationRequest,
    )
    if (!saved) throw new Error(`Unable to save operation`)

    return newOperationRequest
  }

  async resolveRequestState(
    id: string,
    state: OperationRequestState,
    tenantId: string,
    entityId: string,
    subject: string,
  ): Promise<string> {
    this.logger.info(`Resolve operation request id=${id}`)
    if (state === OperationRequestState.PENDING) {
      this.logger.info(`Resolving a request in PENDING state. Skip`)
      return undefined // skip
    }

    const opRequest: OperationRequestEntity =
      await this.operationRequestRepo.findOne(id)
    if (!opRequest) {
      this.logger.error(`unable to find operation request=${id}`)
      throw new EntityNotFoundException(
        `OperationRequestNotFound`,
        `Operation Request=${id} not found`,
        { id },
      )
    }

    this.logger.info(`Operation request id=${id}, state=${opRequest.state}`)

    if (opRequest.state !== OperationRequestState.PENDING) {
      throw new ValidationException(
        'OperationRequestAlreadyResolved',
        `Operation request with id=${id} was already resolved`,
        {
          id,
        },
      )
    }

    const legalEntity: LegalEntityEntity =
      await this.legalEntityService.findOne({
        id: entityId,
        tenantId,
      })

    if (!legalEntity) {
      throw new EntityNotFoundException(
        `LegalEntityNotFound`,
        `Entity with id=${entityId}, tenantId=${tenantId} not found`,
        { entityId, tenantId },
      )
    }

    const resolutionOperationId: string = await this.performResolutionTxs(
      opRequest,
      state,
      tenantId,
      entityId,
      subject,
      opRequest.preRequirementOperationId,
    )

    await this.updateOperationRequest(opRequest.id, {
      state,
      resolutionOperationId: resolutionOperationId,
      preRequirementOperationId: opRequest.preRequirementOperationId,
    })

    return resolutionOperationId
  }

  private async performResolutionTxs(
    opRequest: OperationRequestEntity,
    state: OperationRequestState,
    tenantId: string,
    entityId: string,
    subject: string,
    transferedOperationId?: string,
  ): Promise<string> {
    this.logger.info(
      `performResolutionTxs opId=${opRequest.id}, currentState=${opRequest.state}, newState=${state}`,
    )
    const token: DigitalCurrencyEntity = await this.digitalCurrencyRepo.findOne(
      { currencyEthereumAddress: opRequest.tokenAddress },
    )
    // TODO: throw if not found

    if (opRequest.type === OperationRequestType.AQUISITION) {
      // todo: fiat money handled? then mint the tokens
      if (state === OperationRequestState.APPROVED) {
        return this.digitalCurrencyService.mint(
          token.id,
          opRequest.amount,
          opRequest.requester,
          tenantId,
          subject,
          entityId,
        )
      } else if (state === OperationRequestState.REJECTED) {
        return
      }
    }

    if (opRequest.type === OperationRequestType.REDEEM) {
      if (state === OperationRequestState.REJECTED) {
        // transfer back to requester
        return this.digitalCurrencyService.transfer(
          token.id,
          opRequest.amount,
          opRequest.requester,
          tenantId,
          subject,
          entityId,
        )
      }

      // resolve redeem
      return this.redeem(opRequest, tenantId, subject, token.id, entityId)
    }
  }

  /**
   *
   * @param req
   * @returns
   */
  public async saveRequest(
    req: AquisitionRedeemRequest,
  ): Promise<OperationRequestEntity> {
    const token = await this.digitalCurrencyRepo.findOne({
      currencyEthereumAddress: req.tokenAddress,
    })
    if (!token)
      throw new EntityNotFoundException(
        `DigitalCurrencyNotFound`,
        `Token=${req.tokenAddress} not found`,
        {
          digitalCurrencyAddress: req.tokenAddress,
        },
      )

    const opRequest: OperationRequestEntity =
      await this.operationRequestRepo.findOne(req.id)
    if (opRequest) return opRequest // already exists (i.e, the requester node create this op request)

    const opReqEntity: OperationRequestEntity = {
      amount: req.amount,
      chainName: token.chainName,
      id: req.id,
      issuer: req.issuer,
      requester: req.address,
      state: OperationRequestState.PENDING,
      subject: req.subject,
      tenantId: req.tenantId,
      symbol: token.symbol,
      tokenAddress: token.currencyEthereumAddress,
      type: req.type,
      preRequirementOperationId: req.requiredOperationId,
    }

    return this.operationRequestRepo.save(opReqEntity)
  }

  /**
   *
   * @param id
   * @param params
   * @returns
   */
  public async updateOperationRequest(
    id: string,
    params: Partial<OperationRequestEntity>,
  ): Promise<boolean> {
    this.logger.info(
      `updateOperationRequest id=${id}, params=${JSON.stringify(params)}`,
    )
    const result: UpdateResult = await this.operationRequestRepo.update(
      { id },
      params,
    )
    return result.affected > 0
  }

  /**
   *
   * @returns
   */
  public async getAll(
    skip?: number,
    limit?: number,
    state?: string,
    digitalCurrencyAddress?: string,
    requester?: string,
  ): Promise<Counted<OperationRequestEntity>> {
    let where = {}
    if (digitalCurrencyAddress) {
      where = {
        ...where,
        tokenAddress: digitalCurrencyAddress,
      }
    }
    if (requester) {
      where = {
        ...where,
        requester,
      }
    }
    if (state) {
      where = {
        ...where,
        state,
      }
    }
    const [result, count] = await this.operationRequestRepo.findAndCount({
      where,
      skip,
      take: limit,
    })
    return {
      count,
      result,
    }
  }

  /**
   *
   * @param opRequest
   * @param transferedOperationId
   * @param tenantId
   * @param subject
   * @returns
   */
  private async redeem(
    opRequest: OperationRequestEntity,
    tenantId: string,
    subject: string,
    tokenId: string,
    entityId: string,
  ): Promise<string> {
    const availableTransfer: OperationEntity = await this.operationRepo.findOne(
      {
        operationSourceAddress: opRequest.requester,
        operationTargetAddress: opRequest.issuer,
        status: EntityStatus.Confirmed,
        operationAmount: hexToString(opRequest.amount),
        id: opRequest.preRequirementOperationId,
      },
    )

    if (!availableTransfer) {
      this.logger.info(
        `EntityNotFoundException: ${JSON.stringify({
          operationSourceAddress: opRequest.requester,
          operationTargetAddress: opRequest.issuer,
          status: EntityStatus.Confirmed,
          operationAmount: hexToString(opRequest.amount),
        })}`,
      )
      throw new EntityNotFoundException(
        `OperationNotFound`,
        `cant resolve redemption as TRANSFER operation is missing or in PENDING state`,
        {
          operationSourceAddress: opRequest.requester,
          operationTargetAddress: opRequest.issuer,
          status: EntityStatus.Confirmed,
          operationAmount: hexToString(opRequest.amount),
        },
      )
    }

    const isSameAmount = new BigNumber(availableTransfer.operationAmount).eq(
      new BigNumber(opRequest.amount),
    )
    if (!isSameAmount) {
      // reject and give back amount
      throw new BadRequestException(
        `FundsMismatch`,
        `Operation Request amount=${opRequest.amount}, doesn't match transfered funds=${availableTransfer.operationAmount} to redeem`,
        {
          error: `Operation Request amount=${opRequest.amount}, doesn't match transfered funds=${availableTransfer.operationAmount} to redeem`,
        },
      )
    }

    return this.digitalCurrencyService.burn(
      tokenId,
      opRequest.amount,
      tenantId,
      subject,
      entityId,
    )
  }
}
