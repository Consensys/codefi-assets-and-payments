import { ApiProperty } from "@nestjs/swagger";
import { ITransactionConfig } from "./TransactionConfig";

export class TokensBurnRequest {
  @ApiProperty({
    required: false,
    description: "ERC20 or ConfidentialToken, Amount of tokens, in HEX",
  })
  amount?: string;

  @ApiProperty({
    required: false,
    description: "ERC721 id of the token",
  })
  tokenId?: string;

  @ApiProperty({
    required: true,
    description:
      "The configuration allows to custom some options on the transaction",
  })
  config: ITransactionConfig;

  @ApiProperty({
    required: false,
    description: "supplied operation id, otherewise auto generated",
  })
  operationId?: string;

  @ApiProperty({
    required: false,
    description:
      "Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice",
  })
  idempotencyKey?: string;
}
