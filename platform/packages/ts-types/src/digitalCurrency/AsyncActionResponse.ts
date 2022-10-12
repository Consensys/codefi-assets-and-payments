import { ApiProperty } from "@nestjs/swagger";

export class AsyncActionResponse {
  @ApiProperty({
    description: "Associated operation id",
  })
  operationId: string;
}
