import { ApiProperty } from "@nestjs/swagger";
import { TokenType } from "./TokenType";
import { ITransactionConfig } from "./TransactionConfig";

export class TokensMintRequest {
  @ApiProperty({
    required: true,
    description: "Address of the token contract",
  })
  tokenAddress: string;

  @ApiProperty({
    required: true,
    description: "Type of token",
  })
  type: TokenType;

  @ApiProperty({
    required: false,
    description: "ERC20 or ConfidentialToken,Account to receive the tokens",
  })
  account?: string;

  @ApiProperty({
    required: false,
    description: "ERC20 or ConfidentialToken, Amount of tokens, in WEI",
  })
  amount?: string;

  @ApiProperty({
    required: false,
    description: "ERC721, account to mint the tokens to",
  })
  to?: string;

  @ApiProperty({
    required: false,
    description: "ERC721, id of the token",
  })
  tokenId?: string;

  @ApiProperty({
    required: false,
    description: "UniversalToken, partition",
  })
  partition?: string;

  @ApiProperty({
    required: false,
    description: "UniversalToken, token holder",
  })
  tokenHolder?: string;

  @ApiProperty({
    required: false,
    description: "UniversalToken, value in wei",
  })
  value?: string;

  @ApiProperty({
    required: false,
    description: "UniversalToken, data",
  })
  data?: string;

  @ApiProperty({
    required: true,
    description:
      "The configuration allows to custom some options on the transaction",
  })
  config?: ITransactionConfig;

  @ApiProperty({
    required: false,
    description: "UniversalToken, data",
  })
  operationId?: string;

  @ApiProperty({
    required: false,
    description:
      "Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice",
  })
  idempotencyKey?: string;
}
