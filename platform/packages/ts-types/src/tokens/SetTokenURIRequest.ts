import { ApiProperty } from "@nestjs/swagger";
import { ITransactionConfig } from "./TransactionConfig";

export class SetTokenURIRequest {
  @ApiProperty({
    required: true,
    description: "id of the token",
  })
  tokenId: string;

  @ApiProperty({
    required: true,
    description: "desired uri of the token",
  })
  uri: string;

  @ApiProperty({
    required: true,
    description: "customisation options for the transaction",
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
      "idempotency key (shall be unique and generated on client side), used to ensure object is not created twice",
  })
  idempotencyKey?: string;
}
