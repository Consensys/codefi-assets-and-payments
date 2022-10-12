import { ApiProperty } from "@nestjs/swagger";
import { StoreMappingRequest } from "../entity/StoreMappingRequest";
import { WalletType } from "../entity/WalletType";
import { ProductType } from "./ProductType";

export class TenantUpdateRequest {
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
  metadata: object;

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
