import { ApiProperty } from "@nestjs/swagger";
import { ClientType } from "../common/ClientType";
import { EntityStatus } from "../common/EntityStatus";

export class EntityClientResponse {
  @ApiProperty({
    description: "Name of the client",
    example: "Atom - M2M",
  })
  name: string;

  @ApiProperty({
    description: "Type of client",
    example: "spa",
  })
  type: ClientType;

  @ApiProperty({
    description: "Status of the client",
    example: "pending",
  })
  status: EntityStatus;

  @ApiProperty({
    description: "Id of the client",
    example: "A1Bc2DefGHiJ3klmNOPqrsTu4V5w6x7Y",
  })
  clientId?: string;

  @ApiProperty({
    description: "Date when the client was created",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Date when the client was last updated",
  })
  updatedAt: Date;

  @ApiProperty({
    description: "Date when the client was deleted",
  })
  deletedAt?: Date;
}
