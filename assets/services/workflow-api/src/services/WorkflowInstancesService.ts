import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'

import { TransitionInstancesService } from './TransitionInstancesService'
import { WorkflowTemplatesService } from './WorkflowTemplatesService'
import { WorkflowInstance } from '../models/WorkflowInstanceEntity'
import {
  WorkflowInstanceDto,
  WorkflowInstanceToUpdateDto,
} from '../models/dto/WorkflowInstanceDto'
import { TransitionInstance } from 'src/models/TransitionInstanceEntity'
import { NOT_STARTED } from '../constants/states'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { checkTenantId, requireTenantId } from '../utils/tenant'
import { WorkflowTemplate } from 'src/models/WorkflowTemplateEntity'
import { FindAllOptions, Paginate } from '../constants/query'
import { TransitionInstanceDto } from 'src/models/dto/TransitionInstanceDto'
import { WorkflowType } from '../models/WorkflowType'
import { OrderSide } from '../constants/enums'
import {
  buildQueryForNullUserQuery,
  buildQueryForInvestors,
  checkForNullUserQuery,
  parseFields,
  parseOrder,
} from '../utils/filters'

@Injectable()
export class WorkflowInstancesService {
  constructor(
    @InjectRepository(WorkflowInstance)
    private workflowInstanceRepository: Repository<WorkflowInstance>,
    private transitionInstanceService: TransitionInstancesService,
    private workflowTemplateService: WorkflowTemplatesService,
    private readonly logger: NestJSPinoLogger,
  ) {}

  async create(
    tenantId: string,
    workflowInstance: WorkflowInstanceDto,
  ): Promise<WorkflowInstance> {
    // Verify workflow template exists
    const workflowTemplate: WorkflowTemplate =
      await this.workflowTemplateService.findOne(
        tenantId,
        workflowInstance.workflowTemplateId,
        undefined,
        undefined,
      )

    const result = workflowTemplate?.transitionTemplates.filter(
      (tmpl) =>
        NOT_STARTED === tmpl.fromState &&
        (workflowInstance.state === tmpl.toState ||
          workflowInstance.state === NOT_STARTED) &&
        workflowInstance.name === tmpl.name &&
        workflowInstance.role === tmpl.role,
    )

    if (result?.length !== 1) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error:
            'We could not find a unique transition template matching the transition.',
          result,
        },
        HttpStatus.FORBIDDEN,
      )
    }

    const createdWorkflowInstance: WorkflowInstance =
      await this.workflowInstanceRepository.save({
        ...workflowInstance,
        workflowType: workflowTemplate.workflowType,
        tenantId,
      })

    await this.transitionInstanceService.create(tenantId, {
      name: result[0].name,
      fromState: result[0].fromState,
      toState: result[0].toState,
      role: result[0].role,
      userId: workflowInstance.userId,
      workflowInstanceId: createdWorkflowInstance.id,
    })
    return createdWorkflowInstance
  }

  async findAll({
    tenantId,
    fields,
    options,
    queryOption,
  }: FindAllOptions): Promise<Paginate<WorkflowInstance>> {
    const containNullUserQuery = checkForNullUserQuery(fields)
    let query = []

    if (containNullUserQuery) {
      // Handle null in UserId or RecipientId
      // Can't search for null in UserId and RecipientId. We need to do an OR search.
      query = buildQueryForNullUserQuery(tenantId, fields)
    } else if (queryOption?.isInvestorQuery) {
      // When an investor is querying for instances,  we want to always include the caller as either the receipientId or userId
      // to prevent workflows that a but don't belong to the caller being returned.
      query = buildQueryForInvestors(tenantId, queryOption.callerId, fields)
    } else {
      query = [
        {
          tenantId,
          ...parseFields(fields),
        },
      ]
    }

    const order = parseOrder(options.order)

    this.logger.info(
      { tenantId, ...query, order, limit: options.limit, skip: options.skip },
      'findAll',
    )

    const [data, total] = await this.workflowInstanceRepository.findAndCount({
      where: [...query],
      order,
      take: options.limit,
      skip: options.skip,
    })

    this.logger.info(
      { tenantId, limit: options.limit, skip: options.skip, total },
      `${data.length} fetched out of ${total}`,
    )

    return {
      items: data,
      total,
    }
  }

  async find(
    tenantId: string,
    id: number,
    ids: Array<number>,
    field1: string,
    value1: string,
    field2: string,
    value2: string,
    field3: string,
    value3: string,
    multiValue3: string,
    otherValue1: string,
    offset: number,
    limit: number,
  ): Promise<[WorkflowInstance[], number]> {
    if (ids) {
      return await this.workflowInstanceRepository.findAndCount({
        where: { tenantId, id: In(ids) },
        skip: offset,
        take: limit,
        order: { createdAt: 'DESC' },
      })
    } else if (id) {
      return await this.workflowInstanceRepository.findAndCount({
        where: { tenantId, id },
        skip: offset,
        take: limit,
        order: { createdAt: 'DESC' },
      })
    } else if (
      field3 &&
      (value3 || multiValue3) &&
      field2 &&
      value2 &&
      field1 &&
      value1
    ) {
      if (
        multiValue3 &&
        JSON.parse(multiValue3) &&
        Array.isArray(JSON.parse(multiValue3))
      ) {
        return await this.workflowInstanceRepository.findAndCount({
          where: [
            {
              tenantId,
              [field1]: value1,
              [field2]: value2,
              [field3]: In(JSON.parse(multiValue3)),
            },
            {
              tenantId,
              [field1]: otherValue1,
              [field2]: value2,
              [field3]: In(JSON.parse(multiValue3)),
            },
          ],
          skip: offset,
          take: limit,
          order: { createdAt: 'DESC' },
        })
      } else if (otherValue1) {
        return await this.workflowInstanceRepository.findAndCount({
          where: [
            {
              tenantId,
              [field1]: value1,
              [field2]: value2,
              [field3]: value3,
            },
            {
              tenantId,
              [field1]: otherValue1,
              [field2]: value2,
              [field3]: value3,
            },
          ],
          skip: offset,
          take: limit,
          order: { createdAt: 'DESC' },
        })
      } else {
        return await this.workflowInstanceRepository.findAndCount({
          where: {
            tenantId,
            [field1]: value1,
            [field2]: value2,
            [field3]: value3,
          },
          skip: offset,
          take: limit,
          order: { createdAt: 'DESC' },
        })
      }
    } else if (field2 && value2 && field1 && value1) {
      if (otherValue1) {
        return await this.workflowInstanceRepository.findAndCount({
          where: [
            { tenantId, [field1]: value1, [field2]: value2 },
            { tenantId, [field1]: otherValue1, [field2]: value2 },
          ],
          skip: offset,
          take: limit,
          order: { createdAt: 'DESC' },
        })
      } else {
        this.logger.debug({ [field1]: value1, [field2]: value2 }, 'fetching...')

        const workflowInstances =
          await this.workflowInstanceRepository.findAndCount({
            where: { tenantId, [field1]: value1, [field2]: value2 },
            skip: offset,
            take: limit,
            order: { createdAt: 'DESC' },
          })

        return workflowInstances
      }
    } else if (field1 && value1) {
      if (otherValue1) {
        return await this.workflowInstanceRepository.findAndCount({
          where: [
            { tenantId, [field1]: value1 },
            { tenantId, [field1]: otherValue1 },
          ],
          skip: offset,
          take: limit,
          order: { createdAt: 'DESC' },
        })
      } else {
        return await this.workflowInstanceRepository.findAndCount({
          where: { tenantId, [field1]: value1 },
          skip: offset,
          take: limit,
          order: { createdAt: 'DESC' },
        })
      }
    } else {
      return await this.workflowInstanceRepository.findAndCount({
        where: { tenantId },
        skip: offset,
        take: limit,
        order: { createdAt: 'DESC' },
      })
    }
  }

  async findOne(
    tenantId: string,
    id: number,
    field1: string,
    value1: string,
    field2: string,
    value2: string,
    field3: string,
    value3: string,
  ): Promise<WorkflowInstance> {
    const [instancesList]: [WorkflowInstance[], number] = await this.find(
      tenantId,
      id,
      undefined,
      field1,
      value1,
      field2,
      value2,
      field3,
      value3,
      undefined, // multiValue3
      undefined, // otherValue1
      undefined, // offset
      undefined, // limit
    )

    return instancesList && instancesList.length > 0
      ? instancesList[0]
      : undefined
  }

  async update(
    tenantId: string,
    id: number,
    newInstance: WorkflowInstanceDto,
  ): Promise<WorkflowInstance> {
    // Find the instance
    const currentInstance: WorkflowInstance =
      await this.workflowInstanceRepository.findOne({ where: { id } })

    if (currentInstance) {
      // Test if workflow instance belongs to the expected tenant
      checkTenantId(tenantId, currentInstance.tenantId)

      const workflowTemplate: WorkflowTemplate =
        await this.workflowTemplateService.findOne(
          tenantId,
          currentInstance.workflowTemplateId,
          undefined,
          undefined,
        )
      const [workflowInstanceToUpdate, transitionInstanceToCreate]: [
        WorkflowInstance,
        TransitionInstanceDto,
      ] = this.craftUpdatedWorkflowInstance(
        currentInstance,
        newInstance,
        workflowTemplate,
      )

      const updatedWorkflowInstance: WorkflowInstance =
        await this.workflowInstanceRepository.save(workflowInstanceToUpdate)
      if (transitionInstanceToCreate) {
        await this.transitionInstanceService.create(
          tenantId,
          transitionInstanceToCreate,
        )
      }
      return updatedWorkflowInstance
    } else {
      const error = `Unable to find the instance with id=${id}`
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

  async updateAll(
    tenantId: string,
    newInstances: WorkflowInstanceToUpdateDto[],
  ): Promise<WorkflowInstance[]> {
    // Check array of instances length is positive
    if (!(newInstances.length > 0)) {
      const error = `Array of instances to update shall be positive`
      this.logger.error(error)
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    // Find all instances in DB
    const currentInstances: WorkflowInstance[] = (
      await this.find(
        tenantId,
        undefined, // id
        newInstances.map(
          (newInstance: WorkflowInstanceToUpdateDto) => newInstance.id,
        ),
        undefined, // field1
        undefined, // value1
        undefined, // field2
        undefined, // value2
        undefined, // field3
        undefined, // value3
        undefined, // multiValue3
        undefined, // otherValue1
        0, // offseet
        newInstances.length, // limit
      )
    )[0]

    const currentInstancesMap: {
      [id: string]: WorkflowInstance
    } = currentInstances.reduce(
      (map, currentInstance: WorkflowInstance) => ({
        ...map,
        [currentInstance.id]: currentInstance,
      }),
      {},
    )

    // Check all instances were found in DB
    newInstances.map((newInstance: WorkflowInstanceToUpdateDto) => {
      if (!currentInstancesMap[newInstance.id]) {
        const error = `Unable to find the instance with id=${newInstance.id}`
        this.logger.error(error)
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        )
      }
    })

    // Check all instances belong to the same workflow template (batch updates are only supported for the same workflow template for now)
    const workflowTemplateId: number = currentInstances[0].workflowTemplateId
    if (
      !currentInstances.every(
        (currentInstance) =>
          currentInstance.workflowTemplateId === workflowTemplateId,
      )
    ) {
      const error = `Batch updates are only supported for the same workflow template for now`
      this.logger.error(error)
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    // Find workflow template in DB
    const workflowTemplate: WorkflowTemplate =
      await this.workflowTemplateService.findOne(
        tenantId,
        workflowTemplateId,
        undefined,
        undefined,
      )

    // Craft all instances to update
    const workflowInstancesToUpdate: WorkflowInstance[] = []
    const transitionInstancesToCreate: TransitionInstanceDto[] = []
    newInstances.map((newInstance: WorkflowInstanceToUpdateDto) => {
      const [workflowInstanceToUpdate, transitionInstanceToCreate]: [
        WorkflowInstance,
        TransitionInstanceDto,
      ] = this.craftUpdatedWorkflowInstance(
        currentInstancesMap[newInstance.id], // currentInstance
        newInstance,
        workflowTemplate,
      )
      workflowInstancesToUpdate.push(workflowInstanceToUpdate)
      if (transitionInstanceToCreate) {
        transitionInstancesToCreate.push(transitionInstanceToCreate)
      }
    })

    // Update all workflow instances in DB
    const updatedWorkflowInstances: WorkflowInstance[] =
      await this.workflowInstanceRepository.save(workflowInstancesToUpdate)

    // Create all transition instances in DB
    if (transitionInstancesToCreate.length > 0) {
      await this.transitionInstanceService.createAll(
        tenantId,
        transitionInstancesToCreate,
      )
    }

    return updatedWorkflowInstances
  }

  craftUpdatedWorkflowInstance(
    currentInstance: WorkflowInstance,
    newInstance: WorkflowInstanceDto,
    workflowTemplate: WorkflowTemplate,
  ): [WorkflowInstance, TransitionInstanceDto] {
    const workflowInstanceToUpdate: WorkflowInstance = {
      ...currentInstance,
      state: newInstance.state,
      data: { ...currentInstance.data, ...newInstance.data },
    }

    if (
      newInstance.workflowType === WorkflowType.ORDER &&
      currentInstance.orderSide === OrderSide.BUY
    ) {
      // Only for orders with undefined counterparties. Allow the order creator to update the userId of the order
      // This only happens when it is a buy order
      if (!currentInstance.userId) {
        //UserId is missing
        workflowInstanceToUpdate.userId = newInstance.userId
      }
    }

    if (newInstance.name) {
      workflowInstanceToUpdate.name = newInstance.name
    }
    if (newInstance.role) {
      workflowInstanceToUpdate.role = newInstance.role
    }

    // Allow to update quantity to zero where applicable
    if (newInstance.quantity !== undefined) {
      workflowInstanceToUpdate.quantity = newInstance.quantity
    }
    if (newInstance.price) {
      workflowInstanceToUpdate.price = newInstance.price
    }
    if (newInstance.recipientId) {
      workflowInstanceToUpdate.recipientId = newInstance.recipientId
    }
    if (newInstance.brokerId) {
      workflowInstanceToUpdate.brokerId = newInstance.brokerId
    }
    if (newInstance.agentId) {
      workflowInstanceToUpdate.agentId = newInstance.agentId
    }
    if (newInstance.objectId) {
      workflowInstanceToUpdate.objectId = newInstance.objectId
    }
    if (newInstance.paymentId) {
      workflowInstanceToUpdate.paymentId = newInstance.paymentId
    }
    if (newInstance.documentId) {
      workflowInstanceToUpdate.documentId = newInstance.documentId
    }
    if (newInstance.offerId) {
      workflowInstanceToUpdate.offerId = newInstance.offerId
    }
    if (newInstance.orderSide) {
      workflowInstanceToUpdate.orderSide = newInstance.orderSide
    }

    if (newInstance.state === currentInstance.state) {
      // No state transition requested ==> return
      return [workflowInstanceToUpdate, undefined]
    }

    // State transition requested ==> Check if state transition is valid, according to workflow template
    this.logger.info(
      `State transition is requested from state ${currentInstance.state} to state ${newInstance.state} for instance with id ${currentInstance.id}`,
      {
        fromState: currentInstance.state,
        toState: newInstance.state,
      },
    )
    const result = workflowTemplate?.transitionTemplates.filter(
      (tmpl) =>
        currentInstance.state === tmpl.fromState &&
        newInstance.state === tmpl.toState &&
        newInstance.name === tmpl.name &&
        newInstance.role === tmpl.role,
    )

    if (result?.length !== 1) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error:
            'We could not find a unique transition template matching the transition.',
          result,
        },
        HttpStatus.FORBIDDEN,
      )
    }
    const transitionInstanceToCreate = {
      name: result[0].name,
      fromState: result[0].fromState,
      toState: result[0].toState,
      role: result[0].role,
      userId: newInstance.userId,
      workflowInstanceId: currentInstance.id,
    }

    return [workflowInstanceToUpdate, transitionInstanceToCreate]
  }

  async delete(tenantId: string, id: number): Promise<{ message: string }> {
    // Find the instance
    const targetInstance: WorkflowInstance =
      await this.workflowInstanceRepository.findOne({ where: { id } })

    if (targetInstance) {
      // Test if workflow instance belongs to the expected tenant
      checkTenantId(tenantId, targetInstance.tenantId)

      const { affected } = await this.workflowInstanceRepository.delete(id)
      if (affected > 0) {
        const message = `${affected} deleted workflowInstance(s).`
        this.logger.info(message)
        return { message }
      } else {
        const error = `Unable to delete the workflowInstance with id=${id}`
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
      const error = `Unable to find the workflowInstance with id=${id}`
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

    const { affected } = await this.workflowInstanceRepository.delete({
      tenantId,
    })

    const message = `${affected} deleted workflowInstance(s).`
    this.logger.info(message)
    return { deletedWorkflowInstancesTotal: affected }
  }

  async listAllTransitions(
    tenantId: string,
    id: number,
  ): Promise<TransitionInstance[]> {
    // Find the instance
    const targetInstance: WorkflowInstance =
      await this.workflowInstanceRepository.findOne({ where: { id } })

    if (targetInstance) {
      // Test if workflow instance belongs to the expected tenant
      checkTenantId(tenantId, targetInstance.tenantId)

      return await this.transitionInstanceService.find(
        tenantId,
        undefined,
        'workflowInstanceId',
        `${id}`,
      )
    } else {
      const error = `Unable to find the workflowInstance with id=${id}`
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
}
