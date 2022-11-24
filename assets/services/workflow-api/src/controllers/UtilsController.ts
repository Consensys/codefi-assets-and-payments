import { Controller, Param, Delete } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { TransactionsService } from '../services/TransactionsService'
import { TransitionInstancesService } from '../services/TransitionInstancesService'
import { WorkflowInstancesService } from '../services/WorkflowInstancesService'
import { WorkflowTemplatesService } from '../services/WorkflowTemplatesService'

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

@ApiTags('Utils')
@Controller('utils')
export class UtilsController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly transactionsService: TransactionsService,
    private readonly transitionInstancesService: TransitionInstancesService,
    private readonly workflowInstancesService: WorkflowInstancesService,
    private readonly workflowTemplatesService: WorkflowTemplatesService,
  ) {
    logger.setContext(UtilsController.name)
  }

  @Delete('tenant/:tenantId')
  @ApiOperation({
    summary: 'Delete all data related to a Tenant',
  })
  async deleteTenantData(@Param('tenantId') tenantId: string) {
    const promises = []
    // Delete all Transactions associated to this Tenant
    promises.push(this.transactionsService.deleteByTenant(tenantId))
    // Delete all Transition instances associated to this Tenant
    promises.push(this.transitionInstancesService.deleteByTenant(tenantId))
    // Delete all Workflow instances associated to this Tenant
    promises.push(this.workflowInstancesService.deleteByTenant(tenantId))
    // Delete all Workflow templates associated to this Tenant
    promises.push(this.workflowTemplatesService.deleteByTenant(tenantId))

    const promisesResult = await Promise.all(promises)
    let respMessage = { message: `Tenant ${tenantId} deleted successfully` }

    promisesResult.forEach((elm) => {
      respMessage = { ...elm, ...respMessage }
    })

    return respMessage
  }
}
