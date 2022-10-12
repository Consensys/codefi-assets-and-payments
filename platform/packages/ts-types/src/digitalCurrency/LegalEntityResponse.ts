import { ApiProperty } from "@nestjs/swagger";

export class LegalEntityResponse {
  @ApiProperty({
    description: "Unique system generated identifier for the user tenant",
  })
  id: string;
  @ApiProperty({
    description: "Ethereum address legal entity wallet",
  })
  ethereumAddress: string;
  @ApiProperty({
    description: "System-registered name of the legal entity",
  })
  legalEntityName: string;
}
