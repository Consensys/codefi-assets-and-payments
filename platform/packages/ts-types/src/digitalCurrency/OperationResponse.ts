import { ApiProperty } from "@nestjs/swagger";
import { PaginatedResponse } from "..";
import { EntityStatus } from "../common/EntityStatus";
import { OperationType } from "./OperationType";

export class OperationResponse {
  @ApiProperty({
    description:
      "Unique system generated identifier for the digital currency operation item",
  })
  id: string;

  @ApiProperty({
    description: "Status of the transaction (pending, confirmed, rejected)",
  })
  status: EntityStatus;

  @ApiProperty({
    description: "Description of the operation (eg. mint, burn, transfer)",
  })
  operationType: OperationType;

  @ApiProperty({
    description: "Ethereum address of the digital currency smart contract",
  })
  digitalCurrencyAddress?: string;

  @ApiProperty({
    description:
      "Name of the Ethereum network used to deploy the digital currency",
  })
  chainName: string;

  @ApiProperty({
    description:
      "Amount of tokens in the operation / transaction (hexadecimal)",
  })
  operationAmount: string;

  @ApiProperty({
    description: "Unique system generated identifier for the user tenant",
  })
  tenantId?: string;

  @ApiProperty({
    description: "Auth0 identifier of the user that created the operation",
  })
  createdBy?: string;

  @ApiProperty({
    description: "Ethereum address that triggered the operation",
  })
  operationTriggeredByAddress?: string;

  @ApiProperty({
    description:
      "Target Ethereum address of the operation. This can be a smart contract or an externally owned account (ie. wallet)",
  })
  operationTargetAddress?: string;

  @ApiProperty({
    description: "Ethereum address that crafted the operation",
  })
  operationSourceAddress?: string;

  @ApiProperty({
    description: "Date (ISO 8601) at which the operation was created",
  })
  createdAt?: Date;

  @ApiProperty({
    description: "Unique protocol generated identifier for the operation",
  })
  transactionHash?: string;
}

export class OperationResponseGet extends PaginatedResponse {
  @ApiProperty({
    description: "List of operations on a digital currency",
  })
  items: OperationResponse[];
}
