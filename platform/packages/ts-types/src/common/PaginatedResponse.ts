import { ApiProperty } from "@nestjs/swagger";

export class PaginatedResponse {
  @ApiProperty({
    description: "Total number of items",
  })
  count: number;

  @ApiProperty({
    description: "Pagination offset",
  })
  skip: number;

  @ApiProperty({
    description: "Page limit",
  })
  limit: number;
}
