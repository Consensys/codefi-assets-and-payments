import { ApiProperty } from "@nestjs/swagger";
import { EntityStatus } from "../common/EntityStatus";
import { AdminRequest } from "./AdminRequest";

export class AdminResponse extends AdminRequest {
  @ApiProperty({
    description: "Creation status",
    example: EntityStatus.Confirmed,
  })
  status: EntityStatus;
}
