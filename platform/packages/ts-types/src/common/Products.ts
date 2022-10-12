import { ApiProperty } from "@nestjs/swagger";

export class Products {
  @ApiProperty({
    description: "Assets product",
    example: true,
    required: false,
  })
  assets?: boolean;

  @ApiProperty({
    description: "Payments product",
    example: true,
    required: false,
  })
  payments?: boolean;

  @ApiProperty({
    description: "Compliance product",
    example: false,
    required: false,
  })
  compliance?: boolean;

  @ApiProperty({
    description: "Staking product",
    example: true,
    required: false,
  })
  staking?: boolean;
}
