import { ApiProperty } from "@nestjs/swagger";
import { StoreMappingRequest } from "./StoreMappingRequest";
import { WalletType } from "./WalletType";

export class EntityUpdateRequest {
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
    description: "Address of Ethereum wallet to use by default",
    example: "0xb5747835141b46f7C472393B31F8F5A57F74A44f",
  })
  defaultWallet: string;

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
