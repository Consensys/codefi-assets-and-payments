import { ApiProperty } from "@nestjs/swagger";
import { OperationRequestType } from "./OperationRequestType";

export class OperationRequestRequest {
  @ApiProperty({
    description: "Ethereum address of the wallet used to create the operation",
  })
  requesterAddress: string;

  @ApiProperty({
    description: "Amount of tokens involved on the operation request",
  })
  amount: string;

  @ApiProperty({
    description:
      "Ethereum address of the wallet used to deploy the digital currency",
  })
  issuerAddress: string;

  @ApiProperty({
    description: "Type of the operation request",
    enum: OperationRequestType,
  })
  type: OperationRequestType;
}
