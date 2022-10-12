import { ApiProperty } from "@nestjs/swagger";
import { ClientType } from "../common/ClientType";

export class EntityClientCreateRequest {
  @ApiProperty({
    description: "Type of client",
    example: "spa",
  })
  type: ClientType;
}
