import { ApiProperty } from '@nestjs/swagger'

export class TransitionInstanceDto {
  @ApiProperty()
  name: string

  @ApiProperty()
  userId: string

  @ApiProperty()
  workflowInstanceId: number

  @ApiProperty()
  fromState: string

  @ApiProperty()
  toState: string

  @ApiProperty()
  role: string
}
