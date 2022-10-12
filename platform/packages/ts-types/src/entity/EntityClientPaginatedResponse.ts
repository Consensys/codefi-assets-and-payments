import { ApiProperty } from "@nestjs/swagger";
import { PaginatedResponse } from "../common/PaginatedResponse";
import { EntityClientResponse } from "./EntityClientResponse";

export class EntityClientPaginatedResponse extends PaginatedResponse {
  @ApiProperty({
    description: "Array of elements",
  })
  items: EntityClientResponse[];
}
