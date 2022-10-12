import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, IsOptional, Min, Max } from 'class-validator';

import { keys as EventKeys } from 'src/types/workflow/workflowInstances';
import {
  EventExample,
  Event,
} from 'src/types/workflow/workflowInstances/event';
import { keys as TokenKeys, TokenExample } from 'src/types/token';
import { keys as UserKeys, UserExample } from 'src/types/user';
import { Type } from 'class-transformer';

export const MAX_EVENTS_COUNT = 50;

export class RetrieveEventParamInput {
  @ApiProperty({
    description: 'Index of event to retrieve',
    example: 3491,
  })
  eventIndex: number;
}

export class RetrieveEventOutput {
  @ApiProperty({
    description: 'Retrieved event',
    example: EventExample,
  })
  @ValidateNested()
  event: Event;

  @ApiProperty({
    description: 'Response message',
    example: `Event with index ${EventKeys.ID} retrieved successfully`,
  })
  message: string;
}

export class ListAllEventsQueryInput {
  @ApiProperty({
    description: 'Index of first event to fetch',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Max amount of events to fetch',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Max(MAX_EVENTS_COUNT)
  limit: number;

  @ApiProperty({
    description: 'ID of token, events list shall be filtered for',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  @IsOptional()
  tokenId: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve events with specific states. The parameter shall be a stringified array of states.',
    example: JSON.stringify([EventExample[EventKeys.STATE]]),
  })
  @IsOptional()
  states: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve events with specific function names. The parameter shall be a stringified array of functionNames.',
    example: JSON.stringify([EventExample[EventKeys.NAME]]),
  })
  @IsOptional()
  functionNames: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve events of specific type. The parameter shall be a stringified array of types.',
    example: JSON.stringify([
      EventExample[EventKeys.DATA][EventKeys.DATA__EVENT_TYPE],
    ]),
  })
  @IsOptional()
  types: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve events of specific users. The parameter shall be a stringified array of userIds.',
    example: JSON.stringify([UserExample[UserKeys.USER_ID]]),
  })
  @IsOptional()
  userIds: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve events of specific dates. The parameter shall be a stringified array of dates.',
    example: JSON.stringify([
      EventExample[EventKeys.CREATED_AT].toDateString(),
    ]),
  })
  @IsOptional()
  dates: string;

  @ApiProperty({
    description: 'Sort paramter to sort orders.',
    isArray: true,
    type: String,
    example: JSON.stringify([{ critieria: 'DESC' }]),
  })
  @IsOptional()
  sorts: string;
}

export class ListAllEventsOutput {
  @ApiProperty({
    description: "User's events list",
    example: [EventExample],
  })
  @ValidateNested()
  events: Array<Event>;

  @ApiProperty({
    description: 'Number of events fetched',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'Total number of events',
    example: 543,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: `Events listed successfully for user ${
      UserExample[UserKeys.USER_ID]
    }, filtered for token ${TokenExample[TokenKeys.TOKEN_ID]}`,
  })
  message: string;
}

export class DeleteEventParamInput {
  @ApiProperty({
    description: 'Index of event to delete',
    example: 3491,
  })
  eventIndex: number;
}

export class DeleteEventOutput {
  @ApiProperty({
    description: 'Deleted event',
    example: EventExample,
  })
  @ValidateNested()
  event: Event;

  @ApiProperty({
    description: 'Response message',
    example: `Event with index ${EventKeys.ID} deleted successfully`,
  })
  message: string;
}
