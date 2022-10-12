import { ApiProperty } from "@nestjs/swagger";
import { PaginatedRequest } from "../common/PaginatedRequest";

export class TokenQueryRequest extends PaginatedRequest {
  @ApiProperty({
    description: "Id of the orchestrate transaction",
    required: false,
    example: "123e4567-e89b-12d3-a456-000000000000",
  })
  transactionId?: string;

  @ApiProperty({
    description: "Address of the deployed contract",
    required: false,
    example: "0x32A9daeD647a8CC42FfBAd1498BC32074b0ae0A8",
  })
  contractAddress?: string;

  @ApiProperty({
    description: "Name of the orchestrate registered chain",
    required: false,
    example: "dev",
  })
  chainName?: string;
}
