import { ApiProperty } from "@nestjs/swagger";
import { TokenType } from "./TokenType";
import { ITransactionConfig } from "./TransactionConfig";

export class TokensRegisterRequest {
  @ApiProperty({
    required: true,
    description: "Address of the contract",
  })
  contractAddress: string;

  @ApiProperty({
    required: true,
    description: "The type of the token",
  })
  type: TokenType;

  @ApiProperty({
    required: true,
    description:
      "The configuration allows to custom some options on the transaction",
  })
  config: ITransactionConfig;

  @ApiProperty({
    required: false,
    description: "Unique system generated identifier for the operation",
  })
  operationId?: string;
}
