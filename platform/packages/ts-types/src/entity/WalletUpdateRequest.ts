import { ApiProperty } from "@nestjs/swagger";

export class WalletUpdateRequest {
  @ApiProperty({
    description:
      "Object that can contain additional use-case-specific metadata",
    example: {},
  })
  // eslint-disable-next-line @typescript-eslint/ban-types
  metadata: object;
}
