import { ApiProperty } from "@nestjs/swagger";
import { EntityStatus } from "../common/EntityStatus";
import { TokenType } from "./TokenType";

export class TokenResponse {
  @ApiProperty({
    description: "Id of the token",
  })
  id: string;

  @ApiProperty({
    description: "Status of the token deployment",
  })
  status: EntityStatus;

  @ApiProperty({
    description: "Type of token contract",
  })
  type: TokenType;

  @ApiProperty({
    description: "Name used to deploy the token",
  })
  name: string;

  @ApiProperty({
    description: "Symbol used to deploy the token",
  })
  symbol: string;

  @ApiProperty({
    description: "Number of decimals used to deploy the token",
  })
  decimals?: number;

  @ApiProperty({
    description: "Name of the Orchestrate chain where the token is deployed",
  })
  chainName: string;

  @ApiProperty({
    description: "Address used to deploy the contract",
  })
  deployerAddress: string;

  @ApiProperty({
    description: "Address where the token is deployed",
  })
  contractAddress?: string;

  @ApiProperty({
    description: "Id of the operation",
  })
  operationId?: string;

  @ApiProperty({
    description: "Id of the transaction",
  })
  transactionId?: string;

  @ApiProperty({
    description: "Id of the tenant",
  })
  tenantId?: string;

  @ApiProperty({
    description: "Id of the entity",
  })
  entityId?: string;

  @ApiProperty({
    description: "Date in which the token was created",
  })
  createdAt: Date;

  @ApiProperty({
    description: "User that created the token",
  })
  createdBy?: string;
}
