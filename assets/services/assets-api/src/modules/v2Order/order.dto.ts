import { ApiProperty } from '@nestjs/swagger';
import {
  ValidateNested,
  IsOptional,
  Min,
  Max,
  IsBooleanString,
} from 'class-validator';

import {
  keys as OrderKeys,
  OrderSide,
} from 'src/types/workflow/workflowInstances';
import {
  OrderExample,
  Order,
} from 'src/types/workflow/workflowInstances/order';
import { keys as TokenKeys, TokenExample } from 'src/types/token';
import { keys as UserKeys, UserExample } from 'src/types/user';
import { Type } from 'class-transformer';
import { WorkflowName } from 'src/types/workflow/workflowTemplate';

export const MAX_ORDERS_COUNT = 50;

export class RetrieveOrderParamInput {
  @ApiProperty({
    description: 'Index of order to retrieve',
    example: 3491,
  })
  orderIndex: number;
}

export class RetrieveOrderOutput {
  @ApiProperty({
    description: 'Retrieved order',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description: 'Response message',
    example: `Order with index ${OrderKeys.ID} retrieved successfully`,
  })
  message: string;
}

export class ListAllOrdersQueryInput {
  @ApiProperty({
    description: '',
    example: WorkflowName.ASSET_SECONDARY_TRADE,
    enum: [
      WorkflowName.ASSET_PRIMARY_TRADE,
      WorkflowName.ASSET_SECONDARY_TRADE,
    ],
    required: true,
  })
  workflowName:
    | WorkflowName.ASSET_PRIMARY_TRADE
    | WorkflowName.ASSET_SECONDARY_TRADE;

  @ApiProperty({
    description: 'Index of first order to fetch',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Max amount of orders to fetch',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Max(MAX_ORDERS_COUNT)
  limit: number;

  @ApiProperty({
    description: 'ID of token, orders list shall be filtered for',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  @IsOptional()
  tokenId: string;

  @ApiProperty({
    description: 'Asset class of token, orders list shall be filtered for',
    example: OrderExample[OrderKeys.ASSET_CLASS],
  })
  @IsOptional()
  assetClass: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve orders of specific tokens. The parameter shall be a stringified array of tokenIds.',
    example: JSON.stringify([TokenExample[TokenKeys.TOKEN_ID]]),
  })
  @IsOptional()
  tokenIds: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve orders with specific states. The parameter shall be a stringified array of states.',
    example: JSON.stringify([OrderExample[OrderKeys.STATE]]),
  })
  @IsOptional()
  states: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve orders with specific function names. The parameter shall be a stringified array of functionNames.',
    example: JSON.stringify([OrderExample[OrderKeys.NAME]]),
  })
  @IsOptional()
  functionNames: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve orders of specific users. The parameter shall be a stringified array of userIds.',
    example: JSON.stringify([UserExample[UserKeys.USER_ID]]),
  })
  @IsOptional()
  userIds: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve orders of specific dates. The parameter shall be a stringified array of dates.',
    example: JSON.stringify([
      OrderExample[OrderKeys.CREATED_AT].toDateString(),
    ]),
  })
  @IsOptional()
  dates: string;

  @ApiProperty({
    description: 'Filter parameter to retrieve orders by orderSide',
    example: OrderExample[OrderKeys.ORDER_SIDE],
    enum: OrderSide,
  })
  @IsOptional()
  orderSide: OrderSide;

  @ApiProperty({
    description:
      'Filter parameter to retrieve orders with undefined counterparties',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBooleanString()
  marketplaceOrders: boolean;

  @ApiProperty({
    description: 'Filter parameter to retrieve orders by price',
    example: JSON.stringify({ value: 10, comparator: '>' }),
  })
  @IsOptional()
  price: string;

  @ApiProperty({
    description: 'Filter parameter to retrieve orders by quantity',
    example: JSON.stringify({ value: 10, comparator: '>' }),
  })
  @IsOptional()
  quantity: string;

  @ApiProperty({
    description: 'Sort paramter to sort orders.',
    isArray: true,
    type: String,
    example: JSON.stringify([{ critieria: 'DESC' }]),
  })
  @IsOptional()
  sorts: string;
}

export class ListAllOrdersOutput {
  @ApiProperty({
    description: "User's orders list",
    example: [OrderExample],
  })
  @ValidateNested()
  orders: Array<Order>;

  @ApiProperty({
    description: 'Number of orders fetched',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'Total number of orders',
    example: 543,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: `Orders listed successfully for user ${
      UserExample[UserKeys.USER_ID]
    }, filtered for token ${TokenExample[TokenKeys.TOKEN_ID]}`,
  })
  message: string;
}
