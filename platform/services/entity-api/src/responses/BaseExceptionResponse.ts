// Model of what AppToHttpFilter returns as an API error

import { ApiProperty } from '@nestjs/swagger'

// Just for documentation purposes
export class BaseExceptionResponse {
  @ApiProperty()
  readonly statusCode: number
  @ApiProperty()
  readonly message: string
  @ApiProperty()
  readonly timestamp: string
  @ApiProperty()
  readonly path: string
  @ApiProperty()
  readonly errorCode: string
}
