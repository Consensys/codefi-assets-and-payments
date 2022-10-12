import { ApiProperty } from "@nestjs/swagger";
import { PaginatedRequest } from "../common/PaginatedRequest";
import { WalletType } from "./WalletType";

export class WalletQueryRequest extends PaginatedRequest {
  @ApiProperty({
    description: "Type of wallet",
    example: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
  })
  type?: WalletType;

  @ApiProperty({
    description:
      "Object that can contain additional use-case-specific metadata",
    example: {},
  })
  // eslint-disable-next-line @typescript-eslint/ban-types
  metadata?: object;
}
