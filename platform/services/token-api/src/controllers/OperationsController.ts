import {
  Controller,
  Get,
  HttpCode,
  Query,
  UseFilters,
  UsePipes,
} from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiTags } from '@nestjs/swagger'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { Protected } from '@codefi-assets-and-payments/auth'
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler'
import {
  TokenOperationPaginatedResponse,
  TokenOperationQueryRequest,
} from '@codefi-assets-and-payments/ts-types'
import { OperationsService } from '../services/OperationsService'
import { OperationEntity } from '../data/entities/OperationEntity'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { OperationQueryRequestSchema } from '../validation/ApiRequestsSchema'
import { FindManyOptions } from 'typeorm'

@ApiTags('Operations')
@Controller('operations')
@UseFilters(new AppToHttpFilter())
export class OperationsController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly operationsService: OperationsService,
  ) {
    logger.setContext(OperationsController.name)
  }

  @Get('')
  @HttpCode(200)
  @Protected(true, ['read:token-operation'])
  @ApiOAuth2(['read:token-operation'])
  @UsePipes(new JoiValidationPipe(OperationQueryRequestSchema))
  @ApiOperation({ summary: 'Retrieve operations' })
  async findAll(
    @Query() query: TokenOperationQueryRequest,
  ): Promise<TokenOperationPaginatedResponse> {
    this.logger.info({ query }, `Processing request to retrieve operations`)

    const { skip, limit, ...whereFilter } = query

    const filter: FindManyOptions<OperationEntity> = {
      skip,
      take: limit,
      where: whereFilter,
      order: {
        createdAt: 'DESC',
      },
    }

    const [items, count] = await this.operationsService.getAll(filter)

    return {
      items,
      count,
      skip: query.skip,
      limit: query.limit,
    }
  }
}
