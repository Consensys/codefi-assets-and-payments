import { ApiProperty } from "@nestjs/swagger";

export class AccountResponse {
  @ApiProperty({
    description: "Unique system generated identifier for the account",
  })
  id: string;

  @ApiProperty({
    description: "Ethereum address",
  })
  address: string;

  @ApiProperty({
    description: "Auth0 identifier of the user that created the operation",
  })
  createdBy?: string;

  @ApiProperty({
    description: "Unique system generated identifier for the user tenant",
  })
  tenantId?: string;

  @ApiProperty({
    description: "Unique system generated identifier for the entity",
  })
  entityId?: string;

  @ApiProperty({
    description: "Date (ISO 8601) at which the account was created",
  })
  createdAt?: Date;
}
