import { ApiProperty } from "@nestjs/swagger";

export class BurnDigitalCurrencyRequest {
  @ApiProperty({
    description: "Amount to be burnt in hexadecimal string",
  })
  amount: string;
  @ApiProperty({
    required: false,
    description: "Ethereum address to act on behalf.",
    example: "0x5d2FD0EFb594179D3B772640f8dA975871e460d2",
  })
  ethereumAddress?: string;
}
