import { TransactionStatus } from "./TransactionStatus";
import { ContractStatus } from "./ContractStatus";
import { ApiProperty } from "@nestjs/swagger";

export class Contract {
  @ApiProperty({
    description: "Contract name",
    example: "Name of first contract",
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: "Contract address",
    example: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: "Contract status",
    example: TransactionStatus.Pending,
    required: false,
  })
  status?: TransactionStatus | ContractStatus;

  @ApiProperty({
    description: "Contract transaction hash",
    example:
      "0x3673eb2376b85a896017067d1a12e0b191fab8ac24ab5c18905b8be6f5fe7e2a",
    required: false,
  })
  txHash?: string;
}
