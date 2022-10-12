import { ApiProperty } from "@nestjs/swagger";
import { PaginatedResponse } from "../common/PaginatedResponse";
import { EntityResponse } from "./EntityResponse";

export class EntityPaginatedResponse extends PaginatedResponse {
  @ApiProperty({
    description: "Array of elements",
  })
  items: EntityResponse[];
}
