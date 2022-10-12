import { ApiProperty } from "@nestjs/swagger";
import { AdminRequest } from "../admin/AdminRequest";
import { EntityCreateRequest } from "../entity/EntityCreateRequest";
import { StoreMappingRequest } from "../entity/StoreMappingRequest";
import { WalletType } from "../entity/WalletType";
import { ProductType } from "./ProductType";

export class TenantCreateRequest {
  @ApiProperty({
    description: "Id of the tenant",
    example: "faa08d1c-ca0b-4005-b21f-50fbffc21401",
  })
  id: string;

  @ApiProperty({
    description: "Name of the tenant",
    example: "Atom",
  })
  name: string;

  @ApiProperty({
    description: "Products (network types enable/disable",
    example: {
      assets: true,
      payments: false,
      compliance: true,
      staking: false,
      workflows: true,
    },
  })
  products: { [key in ProductType]?: boolean };

  @ApiProperty({
    description: "Default network key",
    example: "mainnet",
  })
  defaultNetworkKey: string;

  @ApiProperty({
    description:
      "Object that can contain additional use-case-specific metadata",
    example: {},
  })
  // eslint-disable-next-line @typescript-eslint/ban-types
  metadata?: object;

  @ApiProperty({
    description: "Array of initial tenant admins",
    example: [
      {
        email: "first.user@tenant1.com",
        name: "Name of tenant1's admin",
      },
    ],
  })
  initialAdmins?: AdminRequest[];

  @ApiProperty({
    description: "Array of initial tenant entities",
    example: [
      {
        id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        name: "NAB Bank",
        metadata: {},
        initialAdmins: [
          {
            email: "first.user@entity1.com",
            name: "Name of entity1's admin",
          },
        ],
        initialWallets: [
          {
            address: "0xb5747835141b46f7C472393B31F8F5A57F74A44f4f",
            type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
            metadata: {},
          },
        ],
        defaultWallet: "0xb5747835141b46f7C472393B31F8F5A57F74A44f",
      },
    ],
  })
  initialEntities?: EntityCreateRequest[];

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
