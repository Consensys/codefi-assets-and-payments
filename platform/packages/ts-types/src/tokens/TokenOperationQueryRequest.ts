import { ApiProperty } from "@nestjs/swagger";
import { PaginatedRequest } from "../common/PaginatedRequest";

export class TokenOperationQueryRequest extends PaginatedRequest {
  @ApiProperty({
    description: "Id of the operation",
    required: false,
    example: "6f8c23b3-d8bd-4916-91f4-958695ddc356",
  })
  id?: string;

  @ApiProperty({
    description: "Id of the orchestrate transaction",
    required: false,
    example: "123e4567-e89b-12d3-a456-000000000000",
  })
  transactionId?: string;
}
