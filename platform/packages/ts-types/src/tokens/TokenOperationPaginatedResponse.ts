import { ApiProperty } from "@nestjs/swagger";
import { PaginatedResponse } from "../common/PaginatedResponse";
import { TokenOperationResponse } from "./TokenOperationResponse";

export class TokenOperationPaginatedResponse extends PaginatedResponse {
  @ApiProperty({
    description: "Array of elements",
  })
  items: TokenOperationResponse[];
}
