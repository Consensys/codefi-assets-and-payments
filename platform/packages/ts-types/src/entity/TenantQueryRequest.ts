import { ApiProperty } from "@nestjs/swagger";
import { PaginatedRequest } from "../common/PaginatedRequest";
import { ProductType } from "./ProductType";

export class TenantQueryRequest extends PaginatedRequest {
  @ApiProperty({
    description: "Name of the tenant",
    example: "Atom",
  })
  name?: string;

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
  products?: { [key in ProductType]?: boolean };

  @ApiProperty({
    description: "Default network key",
    example: "mainnet",
  })
  defaultNetworkKey?: string;

  @ApiProperty({
    description:
      "Object that can contain additional use-case-specific metadata",
    example: {},
  })
  // eslint-disable-next-line @typescript-eslint/ban-types
  metadata?: object;
}
