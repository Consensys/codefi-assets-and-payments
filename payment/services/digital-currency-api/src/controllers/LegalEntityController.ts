import { LegalEntityResponse } from '@codefi-assets-and-payments/ts-types'
import { Controller, Get, Param, Put, Query, Req } from '@nestjs/common'
import { ApiOAuth2, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { LegalEntityService } from '../services/LegalEntityService'
import { Request } from 'express'
import {
  decodeToken,
  extractTenantIdFromToken,
  extractTokenFromRequest,
  Protected,
} from '@codefi-assets-and-payments/auth'

@ApiTags('Legal Entity')
@Controller('legal-entities')
export class LegalEntityController {
  constructor(private legalEntityService: LegalEntityService) {}

  // @Put()
  // async save(
  //   @Body() request: CreateLegalEntityRequest,
  // ): Promise<LegalEntityEntity> {
  //   const result = await this.legalEntityService.create(
  //     request.legalEntityId,
  //     request.legalEntityName,
  //     request.ethereumAddress,
  //     request.orchestrateChainName,
  //   )
  //   return result
  // }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Standard response for successful HTTP requests',
    type: [LegalEntityResponse],
  })
  @Protected(true, ['read:legal-entity'])
  @ApiOAuth2(['read:legal-entity'])
  @ApiQuery({
    name: 'ethereumAddress',
    required: false,
    description: 'Filter by legal entity ethereum address',
  })
  async findAll(
    @Req() req: Request,
    @Query('ethereumAddress') ethereumAddress?: string,
  ): Promise<LegalEntityResponse[]> {
    const decodedToken = decodeToken(extractTokenFromRequest(req))
    const tenantId = extractTenantIdFromToken(decodedToken)
    let query: any = {
      tenantId,
    }
    if (ethereumAddress) {
      query = {
        ...query,
        ethereumAddress,
      }
    }
    const result = await this.legalEntityService.findAll(query)
    return result
  }

  @Get(`:legalEntityId`)
  @ApiResponse({
    status: 200,
    description: 'Standard response for successful HTTP requests',
    type: LegalEntityResponse,
  })
  @ApiQuery({
    name: 'legalEntityId',
    description: 'Unique system generated identifier for Legal Entity item',
  })
  @Protected(true, ['read:legal-entity'])
  @ApiOAuth2(['read:legal-entity'])
  async findById(
    @Param(`legalEntityId`) legalEntityId: string,
    @Req() req: Request,
  ): Promise<LegalEntityResponse> {
    const decodedToken = decodeToken(extractTokenFromRequest(req))
    const tenantId = extractTenantIdFromToken(decodedToken)
    const result = await this.legalEntityService.findOne({
      id: legalEntityId,
      tenantId,
    })
    return result
  }
}
