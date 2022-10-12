import { ApiProperty } from "@nestjs/swagger";
import { WalletResponse } from "./WalletResponse";
import { WalletType } from "./WalletType";
import { AdminResponse } from "../admin/AdminResponse";
import { EntityStatus } from "../common/EntityStatus";

export class EntityResponse {
  @ApiProperty({
    description: "Id of the entity",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  })
  id: string;

  @ApiProperty({
    description: "Id of the tenant",
    example: "faa08d1c-ca0b-4005-b21f-50fbffc21401",
  })
  tenantId: string;

  @ApiProperty({
    description: "Name of the entity",
    example: "NAB Bank",
  })
  name: string;

  @ApiProperty({
    description:
      "Object that can contain additional use-case-specific metadata",
    example: {},
  })
  // eslint-disable-next-line @typescript-eslint/ban-types
  metadata: object;

  @ApiProperty({
    description: "Array of initial entity admins",
    example: [
      {
        email: "first.user@entity1.com",
        name: "Name of entity1's admin",
        status: EntityStatus.Confirmed,
      },
    ],
  })
  initialAdmins: AdminResponse[];

  @ApiProperty({
    description: "Address of Ethereum wallet to use by default",
    example: "0xb5747835141b46f7C472393B31F8F5A57F74A44f",
  })
  defaultWallet: string;

  @ApiProperty({
    description: "Wallets for that entity",
    example: [
      {
        address: "0xb5747835141b46f7C472393B31F8F5A57F74A44f",
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        metadata: {},
      },
    ],
  })
  wallets?: WalletResponse[];

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
