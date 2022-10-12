import { ApiProperty } from "@nestjs/swagger";
import { PaginatedResponse } from "..";
import { EntityStatus } from "../common/EntityStatus";

export class DigitalCurrencyResponse {
  @ApiProperty({
    description:
      "Unique system generated identifier for the digital currency item",
  })
  id: string;

  @ApiProperty({
    description: "Name of the digital currency",
  })
  name: string;

  @ApiProperty({
    description: "Ticker of the digital currency",
  })
  symbol: string;

  @ApiProperty({
    description: "Number of decimals (1 to 18)",
  })
  decimals: number;

  @ApiProperty({
    description:
      "Ethereum address of the wallet used to deploy the digital currency",
  })
  deployerAddress: string;

  @ApiProperty({
    description: "Total amount of tokens minted (hexadecimal)",
  })
  totalMinted: string;

  @ApiProperty({
    description: "Total amount of tokens burnt (hexadecimal)",
  })
  totalBurnt: string;

  @ApiProperty({
    description:
      "Name of the Ethereum network used to deploy the digital currency",
  })
  chainName: string;

  @ApiProperty({
    description: "Ethereum address of the digital currency smart contract",
  })
  digitalCurrencyAddress?: string;

  @ApiProperty({
    description:
      "Unique system generated identifier for the operation (transaction)",
  })
  operationId?: string;

  // this property will be empty in other nodes than the creator node
  @ApiProperty({
    description: "Auth0 identifier of the user that created the operation",
  })
  createdBy?: string;

  // this property will be empty in other nodes than the creator node
  @ApiProperty({
    description: "Unique system generated identifier for the user tenant",
  })
  tenantId?: string;

  @ApiProperty({
    description:
      "Date (ISO 8601) at which the digital currency smart contract was created",
  })
  createdAt?: Date;

  @ApiProperty({
    description: "Status of the transaction (pending, confirmed, rejected)",
  })
  status: EntityStatus;
}

export class DigitalCurrencyResponseGet extends PaginatedResponse {
  @ApiProperty({
    description: "List of digital currencies",
  })
  items: DigitalCurrencyResponse[];
}
