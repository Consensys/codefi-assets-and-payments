import { ApiProperty } from "@nestjs/swagger";

export class AdminRequest {
  @ApiProperty({
    description: "email",
    example: "first.user@entity1.com",
  })
  email: string;

  @ApiProperty({
    description: "name",
    example: "Name of entity1's first user",
  })
  name: string;
}
