import { ApiProperty } from "@nestjs/swagger";
import { TokenOperationResponse } from "./TokenOperationResponse";
import { TokenResponse } from "./TokenResponse";

export class NewTokenResponse {
  @ApiProperty({
    description: "Created token",
  })
  token?: TokenResponse;

  @ApiProperty({
    description: "Operation of the created token",
    required: true,
  })
  operation: TokenOperationResponse;
}
