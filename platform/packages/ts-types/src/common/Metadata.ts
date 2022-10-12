import { ApiProperty } from "@nestjs/swagger";

export class Metadata {
  @ApiProperty({
    description: "Metadata name",
    example: "This is the metadata name",
  })
  name: string;

  @ApiProperty({
    description: "Metadata description",
    example: "This is the metadata description",
  })
  description: string;
}
