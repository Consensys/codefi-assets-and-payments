import { Injectable, HttpStatus, HttpException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { TransitionInstance } from '../models/TransitionInstanceEntity'
import { TransitionInstanceDto } from '../models/dto/TransitionInstanceDto'
import { checkTenantId, requireTenantId } from '../utils/tenant'
import { NestJSPinoLogger } from '@consensys/observability'

@Injectable()
export class TransitionInstancesService {
  constructor(
    @InjectRepository(TransitionInstance)
    private transitionRepository: Repository<TransitionInstance>,
    private readonly logger: NestJSPinoLogger,
  ) {}

  async create(
    tenantId: string,
    instance: TransitionInstanceDto,
  ): Promise<any> {
    return await this.transitionRepository.save({
      ...instance,
      tenantId,
    })
  }

  async createAll(
    tenantId: string,
    instances: TransitionInstanceDto[],
  ): Promise<any> {
    return await this.transitionRepository.save(
      instances.map((instance: TransitionInstanceDto) => {
        return {
          ...instance,
          tenantId,
        }
      }),
    )
  }

  async find(
    tenantId: string,
    id: number,
    field: string,
    value: string,
  ): Promise<TransitionInstance[]> {
    if (id) {
      return await this.transitionRepository.find({
        where: { tenantId, id },
        order: { createdAt: 'DESC' },
      })
    } else if (field && value) {
      return await this.transitionRepository.find({
        where: { tenantId, [field]: value },
        order: { createdAt: 'DESC' },
      })
    } else {
      return await this.transitionRepository.find({
        where: { tenantId },
        order: { createdAt: 'DESC' },
      })
    }
  }

  async findOne(
    tenantId: string,
    id: number,
    field: string,
    value: string,
  ): Promise<TransitionInstance> {
    const transitionsList: TransitionInstance[] = await this.find(
      tenantId,
      id,
      field,
      value,
    )
    return transitionsList.length > 0 ? transitionsList[0] : undefined
  }

  async update(
    tenantId: string,
    id: number,
    transition: TransitionInstanceDto,
  ): Promise<TransitionInstance> {
    // Find the transition
    const targetTransition: TransitionInstance =
      await this.transitionRepository.findOne({ where: { id } })

    // If it exists, update it
    if (targetTransition) {
      // Test if transition belongs to the expected tenant
      checkTenantId(tenantId, targetTransition.tenantId)

      try {
        const updatedTransition: TransitionInstance =
          await this.transitionRepository.save({ ...transition, id })
        return updatedTransition
      } catch (error) {
        this.logger.error(error)
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        )
      }
    } else {
      const error = `Unable to find the transition with id=${id}`
      this.logger.error(error)
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  async delete(tenantId: string, id: number): Promise<{ message: string }> {
    // Find the transition
    const targetTransition: TransitionInstance =
      await this.transitionRepository.findOne({ where: { id } })

    if (targetTransition) {
      // Test if transition belongs to the expected tenant
      checkTenantId(tenantId, targetTransition.tenantId)

      const { affected } = await this.transitionRepository.delete(id)
      if (affected > 0) {
        const message = `${affected} deleted transition(s).`
        this.logger.info(message)
        return { message }
      } else {
        const error = `Unable to delete the transitionInstance with id=${id}`
        this.logger.error(error)
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error,
          },
          HttpStatus.NOT_FOUND,
        )
      }
    } else {
      const error = `Unable to find the transitionInstance with id=${id}`
      this.logger.error(error)
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  async deleteByTenant(tenantId: string): Promise<{ [key: string]: number }> {
    requireTenantId(tenantId)

    const { affected } = await this.transitionRepository.delete({ tenantId })

    const message = `${affected} deleted transition(s).`
    this.logger.info(message)
    return { deletedTransitionsTotal: affected }
  }
}
