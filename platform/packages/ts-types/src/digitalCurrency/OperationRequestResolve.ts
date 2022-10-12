import { ApiProperty } from "@nestjs/swagger";
import { OperationRequestState } from "./OperationRequestState";
import { OperationRequestType } from "./OperationRequestType";

export class OperationRequestResolve {
  @ApiProperty({
    description: "Status of the operation request",
    enum: OperationRequestState,
  })
  state: OperationRequestState;

  @ApiProperty({
    description: "Type of the operation request",
    enum: OperationRequestType,
  })
  type: OperationRequestType;
}
