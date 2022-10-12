import { ApiProperty } from "@nestjs/swagger";
import { TokenType } from "./TokenType";
import { ITransactionConfig } from "./TransactionConfig";

export class TokensDeployRequest {
  @ApiProperty({
    required: true,
    description: "The type of the token",
  })
  type: TokenType;

  @ApiProperty({
    required: true,
    description: "If the token is private",
  })
  confidential: boolean;

  @ApiProperty({
    required: true,
    description: "The token name",
  })
  name: string;

  @ApiProperty({
    required: true,
    description: "The token decimals",
  })
  decimals?: number;

  @ApiProperty({
    required: true,
    description: "The token symbol",
  })
  symbol: string;

  @ApiProperty({
    required: true,
    description:
      "The configuration allows to custom some options on the transaction",
  })
  config: ITransactionConfig;

  @ApiProperty({
    required: false,
    description:
      "Unique system generated identifier for the operation (transaction)",
  })
  operationId?: string;

  @ApiProperty({
    required: false,
    description:
      "Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice",
  })
  idempotencyKey?: string;
}
