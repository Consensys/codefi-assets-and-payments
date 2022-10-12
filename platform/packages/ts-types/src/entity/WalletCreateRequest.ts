import { ApiProperty } from "@nestjs/swagger";
import { WalletType } from "./WalletType";

export class WalletCreateRequest {
  @ApiProperty({
    description:
      "Only required if the type is any of the following: EXTERNAL_CLIENT_METAMASK, EXTERNAL_CLIENT_METAMASK_INSTITUTIONAL, EXTERNAL_OTHER",
    example: "0xb5747835141b46f7C472393B31F8F5A57F74A44f",
  })
  address?: string;

  @ApiProperty({
    description: "Type of wallet",
    example: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
  })
  type: WalletType;

  @ApiProperty({
    description:
      "Object that can contain additional use-case-specific metadata",
    example: {},
  })
  // eslint-disable-next-line @typescript-eslint/ban-types
  metadata?: object;
}
