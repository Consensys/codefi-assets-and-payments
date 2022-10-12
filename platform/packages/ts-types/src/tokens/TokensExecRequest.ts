import { ApiProperty } from "@nestjs/swagger";
import { ExecArgument } from "./ExecArgument";
import { ITransactionConfig } from "./TransactionConfig";

export class TokensExecRequest {
  @ApiProperty({
    required: true,
    description: "Token smart contract function that will be executed",
  })
  functionName: string;

  @ApiProperty({
    required: true,
    description: "Parameters that the smart contract function requires",
  })
  params: ExecArgument[];

  @ApiProperty({
    required: true,
    description:
      "The configuration allows to custom some options on the transaction",
  })
  config: ITransactionConfig;

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
