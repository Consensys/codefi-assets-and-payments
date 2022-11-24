import { Body, Controller, Get, ParseIntPipe, Put, Query } from '@nestjs/common'
import { ApiTags, ApiQuery, ApiBody } from '@nestjs/swagger'
import { NestJSPinoLogger } from '@consensys/observability'

import { WorkflowInstance } from '../models/WorkflowInstanceEntity'
import { WorkflowInstancesService } from '../services/WorkflowInstancesService'
import { Field, LIMIT, Paginate, SortCriteria } from '../constants/query'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { WorkflowInstanceToUpdateDto } from '../models/dto/WorkflowInstanceDto'
import { IdentityDto } from '../models/dto/IdentityDto'
import { identitySchema } from '../validation/identitySchema'
import { workflowInstancesSchema } from '../validation/workflowInstanceSchema'
import { v2QueryOptionSchema } from '../utils/filters'

@ApiTags('v2/workflow-instances')
@Controller('v2/workflow-instances')
export class WorkflowInstancesControllerV2 {
  constructor(
    private workflowInstancesService: WorkflowInstancesService,
    private readonly logger: NestJSPinoLogger,
  ) {
    logger.setContext(WorkflowInstancesControllerV2.name)
  }

  @Get('')
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({
    name: 'filters',
    isArray: true,
    schema: {
      type: 'array',
      example: [{ name: 'date', comparator: '<', value: '2020-10-11' }],
      items: {
        // WORKAROUND because doesn't serialize the param as array of objects sending string
        type: 'string',
        //type: 'object',
        // properties: {
        //   name: { type: 'string' },
        //   comparator: { type: 'string' },
        //   value: { type: 'string' },
        // },
      },
    },
  })
  @ApiQuery({
    name: 'order',
    required: false,
    isArray: true,
    schema: {
      type: 'array',
      example: [{ date: 'DESC' }],
      items: {
        // WORKAROUND because doesn't serialize the param as array of objects sending string
        type: 'string',
        // type: 'object',
        // properties: {
        //   name: { type: 'string' },
        //   comparator: { type: 'string' },
        //   value: { type: 'string' },
        // },
      },
    },
  })
  @ApiQuery({
    name: 'options',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'skip', type: 'number', required: false })
  async findAll(
    @Query('tenantId') tenantId: string,
    @Query('filters') filters: string[] | string = [],
    @Query('order') order: string[] | string = [],
    @Query('limit', ParseIntPipe) limit = 100,
    @Query('skip', ParseIntPipe) skip = 0,
    @Query('queryOption') options?: string,
  ): Promise<Paginate<WorkflowInstance>> {
    this.logger.info({ tenantId, filters, order, limit, skip }, 'fetching...')

    const normalizedFilters = Array.isArray(filters) ? filters : [filters]
    const normalizedOrderCriteria = Array.isArray(order) ? order : [order]

    const withoutEmpty = (f) => f !== '' && f !== undefined && f !== null

    // Input e.g.  [ "{ name: 'field', comparator: '=', value: 'foo' }" ]
    const parseFilters = (filters): Field[] => {
      try {
        return filters.map((filter) => {
          const { name, comparator, value } = JSON.parse(filter.trim())
          const parsed = { name, comparator, value }
          ;['name', 'comparator', 'value'].forEach((prop) => {
            if (parsed[prop] === undefined) {
              throw new Error(
                `Missing "${prop}" property in ${JSON.stringify(parsed)}`,
              )
            }
          })
          return { name, comparator, value }
        })
      } catch (e) {
        const message = `Failed to parse "filters" param: ${e.message}`
        this.logger.error(message)
        throw new Error(message)
      }
    }

    // Input e.g.  [ "{ field: 'DESC' }" ]
    const parseOrder = (normalizedOrderCriteria): SortCriteria[] => {
      try {
        return normalizedOrderCriteria.map((criteria) => {
          const parsed = JSON.parse(criteria)
          if (Object.entries<string>(parsed).length === 0) {
            throw new Error(`Empty criteria`)
          }
          Object.entries<string>(parsed).forEach(([k, v]) => {
            if (!['DESC', 'ASC'].includes(v)) {
              throw new Error(
                `Invalid value "${v}" for order criteria "${k}". Valid values (ASC, DESC)`,
              )
            }
          })
          return parsed
        })
      } catch (e) {
        const message = `Failed to parse "order" param: ${e.message}`
        this.logger.error(message)
        throw new Error(message)
      }
    }

    // Input e.g. "100"
    const parseNumber = (value) => {
      const parsed = parseInt(value, 10)
      if (!isNaN(parsed)) {
        return parsed
      }
      throw new Error(`Failed to parse "${value}". It isn't a number`)
    }

    const fields = parseFilters(normalizedFilters.filter(withoutEmpty))
    const parsedOrder = parseOrder(normalizedOrderCriteria.filter(withoutEmpty))
    const parsedLimit = parseNumber(limit) || LIMIT
    const parsedSkip = parseNumber(skip)

    let queryOption
    if (options) {
      const parsedOption = JSON.parse(options)
      const { error } = v2QueryOptionSchema.validate(parsedOption)
      if (error) {
        throw new Error(
          `Failed to validate V2QueryOption schema ${error.details[0]}`,
        )
      }
      queryOption = parsedOption
    }

    return await this.workflowInstancesService.findAll({
      tenantId,
      fields,
      options: {
        skip: parsedSkip,
        limit: parsedLimit,
        order: parsedOrder,
      },
      queryOption,
    })
  }

  @Put('')
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiBody({ type: [WorkflowInstanceToUpdateDto] })
  async updateAll(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Body(new JoiValidationPipe(workflowInstancesSchema))
    instances: WorkflowInstanceToUpdateDto[],
  ): Promise<any> {
    return await this.workflowInstancesService.updateAll(
      identityQuery.tenantId,
      instances,
    )
  }
}
