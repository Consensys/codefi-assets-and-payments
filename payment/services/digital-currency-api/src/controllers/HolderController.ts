import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler'
import {
  Controller,
  Get,
  GoneException,
  HttpStatus,
  Query,
  UseFilters,
} from '@nestjs/common'
import {
  ApiOAuth2,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { HolderService } from '../services/HolderService'
import { HolderResponseGet } from '@codefi-assets-and-payments/ts-types'
import { Protected } from '@codefi-assets-and-payments/auth'
import { HolderBalanceResponse } from '../responses/HolderBalanceResponse'

@Controller('holders')
@ApiTags('Holders')
@UseFilters(new AppToHttpFilter())
export class HolderController {
  constructor(private holderService: HolderService) {}

  @Get()
  @ApiOperation({ deprecated: true, description: 'Use `/balance` instead.' })
  @ApiResponse({
    status: 200,
    description: 'Standard response for successful HTTP requests',
    type: [HolderResponseGet],
  })
  @Protected(true, ['read:digital-currency-holders'])
  @ApiOAuth2(['read:digital-currency'])
  @ApiQuery({
    name: 'ethereumAddress',
    required: false,
    description: 'Filter by holder ethereum address',
  })
  @ApiQuery({
    name: 'currencyEthereumAddress',
    required: false,
    description: 'Filter by digital currency smart contract address',
    isArray: true,
  })
  @ApiQuery({
    name: 'chainName',
    required: false,
    description: 'Filter by chain name of the deployed currency smart contract',
  })
  @ApiQuery({ name: 'skip', required: false, description: 'Pagination offset' })
  @ApiQuery({ name: 'limit', required: false, description: 'Page limit' })
  /**
   * @deprecated Use `/balance` instead.
   */
  async getAll(
    @Query('ethereumAddress') ethereumAddress?: string,
    @Query('currencyEthereumAddress') currencyEthereumAddress?: string[],
    @Query('chainName') chainName?: string,
    @Query('skip') skip?: number,
    @Query('limit') limit?: number,
  ): Promise<HolderResponseGet> {
    throw new GoneException(
      {
        status: HttpStatus.GONE,
        error: `Endpoint deprecated, use "/balance".`,
      },
      `Endpoint deprecated, use "/balance".`,
    )
  }

  @Get(`balance`)
  @ApiResponse({
    status: 200,
    description: 'Standard response for successful HTTP requests',
    type: HolderBalanceResponse,
  })
  @Protected(true, ['read:digital-currency-holders'])
  @ApiOAuth2(['read:digital-currency-holders'])
  @ApiQuery({
    name: 'ethereumAddress',
    required: true,
    description: 'Filter by holder ethereum address',
  })
  @ApiQuery({
    name: 'currencyEthereumAddress',
    required: true,
    description: 'Filter by digital currency smart contract address',
  })
  @ApiQuery({
    name: 'chainName',
    required: true,
    description: 'Filter by chain name of the deployed currency smart contract',
  })
  async getBalance(
    @Query('ethereumAddress') ethereumAddress: string,
    @Query('currencyEthereumAddress') currencyEthereumAddress: string,
    @Query('chainName') chainName: string,
  ): Promise<HolderBalanceResponse> {
    const response = await this.holderService.findBalance(
      ethereumAddress,
      currencyEthereumAddress,
      chainName,
    )
    return { balance: response }
  }
}
