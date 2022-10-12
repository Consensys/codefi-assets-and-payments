import { ApiProperty } from "@nestjs/swagger";
import { PaginatedResponse } from "..";
import { OperationRequestState } from "./OperationRequestState";
import { OperationRequestType } from "./OperationRequestType";

export class OperationRequestResponse {
  @ApiProperty({
    description:
      "Unique system generated identifier for the operation request item",
  })
  id: string;

  @ApiProperty({
    description: "Type of the operation request",
    enum: OperationRequestType,
  })
  type: OperationRequestType;

  @ApiProperty({
    description: "Ethereum address of the wallet used to create the operation",
  })
  requester: string;

  @ApiProperty({
    description:
      "Ethereum address of the wallet used to deploy the digital currency",
  })
  issuer: string;

  @ApiProperty({
    description: "Amount of tokens involved on the operation request",
  })
  amount: string;

  @ApiProperty({
    description: "Ethereum address of the digital currency smart contract",
  })
  tokenAddress: string;

  @ApiProperty({
    description: "Ticker of the digital currency",
  })
  symbol: string;

  @ApiProperty({
    description: "Name of the Ethereum network",
  })
  chainName: string;

  @ApiProperty({
    description: "Status of the operation request",
    enum: OperationRequestState,
  })
  state: OperationRequestState;

  @ApiProperty({
    description:
      "Unique system generated identifier for the operation created as result of the operation request",
  })
  preRequirementOperationId?: string;

  @ApiProperty({
    description:
      "Unique system generated identifier for the operation request item",
  })
  resolutionOperationId?: string;

  @ApiProperty({
    description: "Unique system generated identifier for the user tenant",
  })
  tenantId: string;

  @ApiProperty({
    description: "Auth0 identifier of the user that created the operation",
  })
  subject: string;
}

export class OperationRequestResponseGet extends PaginatedResponse {
  @ApiProperty({
    description: "List of operation requests for a digital currency",
  })
  items: OperationRequestResponse[];
}
