import { ApiProperty } from "@nestjs/swagger";
import { PaginatedResponse } from "../common/PaginatedResponse";
import { TokenResponse } from "./TokenResponse";

export class TokenPaginatedResponse extends PaginatedResponse {
  @ApiProperty({
    description: "Array of elements",
  })
  items: TokenResponse[];
}
