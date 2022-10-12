import { ApiProperty } from "@nestjs/swagger";
import { AdminRequest } from "../admin/AdminRequest";
import { WalletCreateRequest } from "./WalletCreateRequest";
import { StoreMappingRequest } from "./StoreMappingRequest";
import { WalletType } from "./WalletType";

export class EntityCreateRequest {
  @ApiProperty({
    description: "Id of the entity",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  })
  id?: string;

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
  metadata?: object;

  @ApiProperty({
    description: "Array of initial entity admins",
    example: [
      {
        email: "first.user@entity1.com",
        name: "Name of entity1's admin",
      },
    ],
  })
  initialAdmins?: AdminRequest[];

  @ApiProperty({
    description: "Array of Ethereum wallets (includes default wallet)",
    example: [
      {
        address: "0xb5747835141b46f7C472393B31F8F5A57F74A44f4f",
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        metadata: {},
      },
    ],
  })
  initialWallets?: WalletCreateRequest[];

  @ApiProperty({
    description: "Address of Ethereum wallet to use by default",
    example: "0xb5747835141b46f7C472393B31F8F5A57F74A44f",
  })
  defaultWallet?: string;

  @ApiProperty({
    description: "Array of store mappings",
    example: [
      {
        walletType: WalletType.INTERNAL_CLIENT_AWS_VAULT,
        storeId: "some-aws-store-1",
      },
      {
        walletType: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
        storeId: "some-azure-store-3",
      },
    ],
  })
  stores?: StoreMappingRequest[];
}
