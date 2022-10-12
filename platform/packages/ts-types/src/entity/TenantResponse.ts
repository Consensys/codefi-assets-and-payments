import { ApiProperty } from "@nestjs/swagger";
import { AdminResponse } from "../admin/AdminResponse";
import { EntityStatus } from "../common/EntityStatus";
import { ProductType } from "./ProductType";

export class TenantResponse {
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
  metadata: object;

  @ApiProperty({
    description: "Array of initial tenant admins",
    example: [
      {
        email: "first.user@tenant1.com",
        name: "Name of tenant1's admin",
        status: EntityStatus.Confirmed,
      },
    ],
  })
  initialAdmins: AdminResponse[];

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
