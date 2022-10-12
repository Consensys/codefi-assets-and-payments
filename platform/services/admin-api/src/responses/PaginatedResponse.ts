import { ApiProperty } from '@nestjs/swagger'

export class PaginatedResponse {
  @ApiProperty({ description: 'number of total records' })
  count: number
  @ApiProperty({ description: 'pagination offset' })
  skip: number
  @ApiProperty({ description: 'number of records per page' })
  limit: number
}
