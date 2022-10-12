import { ApiProperty } from "@nestjs/swagger";

export class CreateDigitalCurrencyRequest {
  @ApiProperty({
    description: "Name of the currency",
  })
  name: string;
  @ApiProperty({
    description: "Ticker of the digital currency",
  })
  symbol: string;
  @ApiProperty({
    description:
      "Decimals, only for UI representation (See ERC20 decimals description)",
  })
  decimals?: number;
  @ApiProperty({
    required: false,
    description: "Ethereum address to act on behalf.",
    example: "0x5d2FD0EFb594179D3B772640f8dA975871e460d2",
  })
  ethereumAddress?: string;
}
