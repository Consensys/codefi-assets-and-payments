import { ApiProperty } from "@nestjs/swagger";

export class TransferDigitalCurrencyRequest {
  @ApiProperty({
    description: "Amount to transfer in hexadecimal string",
  })
  amount: string;
  @ApiProperty({
    description: "Ethereum address of the recipient",
  })
  to: string;
  @ApiProperty({
    required: false,
    description: "Ethereum address to act on behalf.",
    example: "0x5d2FD0EFb594179D3B772640f8dA975871e460d2",
  })
  ethereumAddress?: string;
}
