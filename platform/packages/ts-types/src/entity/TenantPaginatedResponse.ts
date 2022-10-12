import { ApiProperty } from "@nestjs/swagger";
import { PaginatedResponse } from "../common/PaginatedResponse";
import { TenantResponse } from "./TenantResponse";

export class TenantPaginatedResponse extends PaginatedResponse {
  @ApiProperty({
    description: "Array of elements",
  })
  items: TenantResponse[];
}
