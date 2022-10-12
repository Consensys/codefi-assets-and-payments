import { ApiProperty } from "@nestjs/swagger";
import { WalletType } from "./WalletType";

export class StoreMappingRequest {
  @ApiProperty({
    description: "Type of wallet",
  })
  walletType: WalletType;

  @ApiProperty({
    description: "Id of the store",
  })
  storeId: string;
}
