import { ApiProperty } from "@nestjs/swagger";

export class AsyncTokenResponse {
  @ApiProperty({
    description: "Associated transaction id",
  })
  transactionId: string;
}
