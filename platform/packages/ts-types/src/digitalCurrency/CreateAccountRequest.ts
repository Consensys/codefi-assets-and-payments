import { ApiProperty } from "@nestjs/swagger";

export class CreateAccountRequest {
  @ApiProperty({
    description: "Account name",
  })
  name: string;
}
