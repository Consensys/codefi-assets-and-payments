import { ApiProperty } from '@nestjs/swagger'

export class TransactionDto {
  @ApiProperty()
  status: string

  @ApiProperty()
  signerId: string

  @ApiProperty()
  callerId: string

  @ApiProperty()
  identifierOrchestrateId: string

  @ApiProperty()
  identifierTxHash: string

  @ApiProperty()
  identifierCustom: string

  @ApiProperty()
  callbacks: object

  @ApiProperty()
  context: object
}
