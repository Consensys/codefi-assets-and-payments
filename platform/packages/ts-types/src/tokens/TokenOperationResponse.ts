import { ApiProperty } from "@nestjs/swagger";
import { IReceipt } from "pegasys-orchestrate/lib/kafka/types/IReceipt";
import { EntityStatus } from "../common/EntityStatus";
import { TokenOperationType } from "./TokenOperationType";

export class TokenOperationResponse {
  @ApiProperty({
    description: "Id of the operation",
  })
  id: string;

  @ApiProperty({
    description: "Status of the operation",
  })
  status: EntityStatus;

  @ApiProperty({
    description: "Type of token operation",
  })
  operation: TokenOperationType;

  @ApiProperty({
    description: "Id of the transaction",
  })
  transactionId?: string;

  @ApiProperty({
    description: "Name of the Orchestrate chain where the operation occurred",
  })
  chainName: string;

  @ApiProperty({
    description: "Id of the tenant",
  })
  tenantId?: string;

  @ApiProperty({
    description: "Id of the entity",
  })
  entityId?: string;

  @ApiProperty({
    description: "Block in which the operation was added",
  })
  blockNumber?: number;

  @ApiProperty({
    description: "Hash of the transaction",
  })
  transactionHash?: string;

  @ApiProperty({
    description: "Transaction receipt",
  })
  receipt?: IReceipt;

  @ApiProperty({
    description: "Decoded event",
  })
  decodedEvent?: any;

  @ApiProperty({
    description: "Date in which the token was created",
  })
  createdAt: Date;

  @ApiProperty({
    description: "User that created the token",
  })
  createdBy?: string;
}
