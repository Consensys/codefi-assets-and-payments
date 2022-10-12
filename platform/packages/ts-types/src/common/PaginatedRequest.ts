import { ApiProperty } from "@nestjs/swagger";

export class PaginatedRequest {
  @ApiProperty({
    description: "Pagination offset",
    required: false,
    example: 0,
  })
  skip?: number;

  @ApiProperty({
    description: "Page limit",
    required: false,
    example: 1000,
  })
  limit?: number;
}
