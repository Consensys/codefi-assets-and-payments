import { ApiProperty } from "@nestjs/swagger";
import { PaginatedRequest } from "../common/PaginatedRequest";

export class EntityQueryRequest extends PaginatedRequest {
  @ApiProperty({
    description: "List of entity ids",
    example: [
      "7bf4dc14-6d0f-4bda-a9a9-75f072c961a6",
      "98b4abab-cea7-4a6b-b53a-c722e82a079a",
      "fb8f1624-b034-48b7-95a9-f2fe27f768c0",
    ],
  })
  ids?: string[];

  @ApiProperty({
    description: "Name of the entity",
    example: "NAB Bank",
  })
  name?: string;

  @ApiProperty({
    description: "Address of Ethereum wallet to use by default",
    example: "0xb5747835141b46f7C472393B31F8F5A57F74A44f",
  })
  defaultWallet?: string;

  @ApiProperty({
    description:
      "Object that can contain additional use-case-specific metadata",
    example: {
      firstName: "John",
      lastName: "Smith",
    },
  })
  // eslint-disable-next-line @typescript-eslint/ban-types
  metadata?: object;

  @ApiProperty({
    description:
      "Object that can contain additional use-case-specific metadata stored as array options",
    example: {
      userType: ["ADMIN", "BANKER"],
    },
  })
  metadataWithOptions?: { [key: string]: any[] };

  @ApiProperty({
    description:
      "Determines if wallets array should be included with the entity",
    example: false,
  })
  includeWallets?: boolean;
}
