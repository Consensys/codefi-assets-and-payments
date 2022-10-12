import { Controller, Param, Delete } from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ElementService } from 'src/modules/ElementModule/ElementService';
import { TemplateService } from 'src/modules/TemplateModule/TemplateService';
import { ReviewService } from 'src/modules/ReviewModule/ReviewService';
import { ElementInstanceService } from 'src/modules/ElementInstanceModule/ElementInstanceService';

@ApiTags('Utils')
@Controller('utils')
export class UtilsController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly elementService: ElementService,
    private readonly templateService: TemplateService,
    private readonly reviewService: ReviewService,
    private readonly elementInstanceService: ElementInstanceService,
  ) {
    logger.setContext(UtilsController.name);
  }

  @Delete('tenant/:tenantId')
  @ApiParam({ name: 'tenantId', required: true })
  @ApiOperation({
    summary: 'Delete all data related to a Tenant',
  })
  async deleteTenantData(@Param('tenantId') tenantId: string) {
    const promises = [];
    // Delete all Elements associated to this Tenant
    promises.push(this.elementService.removeByTenant(tenantId));
    // Delete all Templates associated to this Tenant
    promises.push(this.templateService.removeByTenant(tenantId));
    // Delete all Reviews associated to this Tenant
    promises.push(this.reviewService.removeByTenant(tenantId));
    // Delete all Element instances associated to this Tenant
    promises.push(this.elementInstanceService.removeByTenant(tenantId));

    const promisesResult = await Promise.all(promises);
    let respMessage = { message: `Tenant ${tenantId} deleted successfully` };

    promisesResult.forEach((elm) => {
      respMessage = { ...elm, ...respMessage };
    });

    return respMessage;
  }
}
