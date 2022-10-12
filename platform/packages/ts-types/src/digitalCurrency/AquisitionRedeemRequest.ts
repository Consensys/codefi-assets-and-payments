import { ApiProperty } from "@nestjs/swagger";
import { OperationRequestAction } from "./OperationRequestAction";
import { OperationRequestType } from "./OperationRequestType";

export class AquisitionRedeemRequest {
  @ApiProperty({
    description:
      "Unique system generated identifier for the operation request item",
  })
  id: string;

  @ApiProperty({
    description: "Unique system generated identifier for the user tenant",
  })
  tenantId: string;

  @ApiProperty({
    description: "Auth0 identifier of the user that created the operation",
  })
  subject: string;

  @ApiProperty({
    description:
      "Unique system generated identifier for the operation created as result of the operation request",
  })
  requiredOperationId: string; // (i.e, transfer requirement for redeem )

  @ApiProperty({
    description:
      "Unique system generated identifier for the operation request item",
  })
  resolutionOperationId?: string; // when the request is resolved

  @ApiProperty({
    description: "Total amount of tokens involved on the operation request",
  })
  amount: string;

  @ApiProperty({
    description:
      "Ethereum address of the wallet used to request the operation request",
  })
  address: string;

  @ApiProperty({
    description:
      "Ethereum address of the wallet used to deploy the digital currency",
  })
  issuer: string;

  @ApiProperty({
    description: "Ethereum address of the digital currency smart contract",
  })
  tokenAddress: string;

  @ApiProperty({
    description: "Type of the operation request",
    enum: OperationRequestType,
  })
  type: OperationRequestType;

  @ApiProperty({
    description: "Action of the operation request",
    enum: OperationRequestAction,
  })
  action: OperationRequestAction;
}
