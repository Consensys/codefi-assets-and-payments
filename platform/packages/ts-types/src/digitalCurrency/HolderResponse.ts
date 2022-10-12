import { ApiProperty } from "@nestjs/swagger";
import { PaginatedResponse } from "..";

export class HolderResponse {
  @ApiProperty({
    description:
      "Unique system generated identifier for the digital currency holder item.",
  })
  id: string;

  @ApiProperty({
    description: "Ethereum address of the wallet",
  })
  ethereumAddress: string;

  @ApiProperty({
    description: "Ethereum address of the digital currency smart contract",
  })
  currencyEthereumAddress: string;

  @ApiProperty({
    description:
      "Name of the Ethereum network used to deploy the digital currency",
  })
  currencyChainName: string;
  @ApiProperty({
    description: "Holder balance for this digital currency",
  })
  balance: string;
}

export class HolderResponseGet extends PaginatedResponse {
  @ApiProperty({
    description: "List of digital currency holders",
  })
  items: HolderResponse[];
}
