import { ApiProperty } from "@nestjs/swagger";
import { WalletType } from "../entity/WalletType";

export class WalletResponse {
  @ApiProperty({
    description: "address",
    example: "0xb5747835141b46f7C472393B31F8F5A57F74A44f",
  })
  address: string;

  @ApiProperty({
    description: "type",
    example: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
  })
  type: WalletType;

  @ApiProperty({
    description:
      "Object that can contain additional use-case-specific metadata",
    example: {},
  })
  // eslint-disable-next-line @typescript-eslint/ban-types
  metadata: object;

  @ApiProperty({
    description: "Id of the Orchestrate store",
  })
  storeId: string;

  @ApiProperty({
    description: "Date in which the tenant was created",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Date of last time in which the tenant was updated",
  })
  updatedAt: Date;

  @ApiProperty({
    description: "Date in which the tenant was deleted",
  })
  deletedAt?: Date;

  @ApiProperty({
    description: "User that created the tenant",
  })
  createdBy: string;
}
