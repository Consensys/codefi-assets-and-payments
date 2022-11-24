import { Controller, Param, Delete, Query } from '@nestjs/common';
import { NestJSPinoLogger } from '@consensys/observability';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TokensService } from 'src/services/TokensService';
import { ProjectsService } from 'src/services/ProjectsService';
import { ConfigsService } from 'src/services/ConfigsService';
import { AssetTemplatesService } from 'src/services/AssetTemplatesService';
import { AssetInstancesService } from 'src/services/AssetInstancesService';
import { AssetElementsService } from 'src/services/AssetElementsService';
import { AssetCycleInstancesService } from 'src/services/AssetCycleInstancesService';
import { DeleteTenantMetaDataDto } from 'src/model/dto/DeleteTenantMetaDataDto';

@ApiTags('Utils')
@Controller('utils')
export class UtilsController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly tokensService: TokensService,
    private readonly projectsService: ProjectsService,
    private readonly configsService: ConfigsService,
    private readonly assetTemplatesService: AssetTemplatesService,
    private readonly assetInstancesService: AssetInstancesService,
    private readonly assetElementsService: AssetElementsService,
    private readonly assetCycleInstancesService: AssetCycleInstancesService,
  ) {
    logger.setContext(UtilsController.name);
  }

  @Delete('tenant/:tenantId')
  @ApiOperation({
    summary: 'Delete all data related to a Tenant',
  })
  async deleteTenantData(
    @Param('tenantId') tenantId: string,
    @Query() queryParms: DeleteTenantMetaDataDto,
  ) {
    //TODO this requires to research and fix nestJS level to make boolean parameters to come as boolean correctly 2021-Sep-16
    // Convert boolean parameters coming as string to boolean
    for (const property in queryParms) {
      if (queryParms[property] === 'true') {
        queryParms[property] = true;
      } else if (queryParms[property] === 'false') {
        queryParms[property] = false;
      }
    }

    const promises: Promise<{ [key: string]: number }>[] = [];

    // Delete all Configs associated to this Tenant, unless requested otherwise
    if (!queryParms.doNotDeleteTenantConfigs) {
      promises.push(this.configsService.deleteByTenant(tenantId));
    }

    // Delete all Assets templates associated to this Tenant, unless requested otherwise
    if (!queryParms.doNotDeleteTenantAssetTemplates) {
      promises.push(this.assetTemplatesService.deleteByTenant(tenantId));
    }

    // Delete all Assets elements associated to this Tenant, unless requested otherwise
    if (!queryParms.doNotDeleteTenantAssetElements) {
      promises.push(this.assetElementsService.deleteByTenant(tenantId));
    }

    // Delete all Tokens associated to this Tenant
    promises.push(this.tokensService.deleteByTenant(tenantId));
    // Delete all Projects associated to this Tenant
    promises.push(this.projectsService.deleteByTenant(tenantId));
    // Delete all Assets instances associated to this Tenant
    promises.push(this.assetInstancesService.deleteByTenant(tenantId));
    // Delete all Assets cycle instances associated to this Tenant
    promises.push(this.assetCycleInstancesService.deleteByTenant(tenantId));

    const promisesResult = await Promise.all(promises);
    let respMessage = { message: `Tenant ${tenantId} deleted successfully` };

    promisesResult.forEach((elm) => {
      respMessage = { ...elm, ...respMessage };
    });

    return respMessage;
  }
}
