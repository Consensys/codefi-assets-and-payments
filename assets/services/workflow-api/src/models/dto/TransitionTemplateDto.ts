import { ApiProperty } from '@nestjs/swagger'

export class TransitionTemplateDto {
  @ApiProperty()
  name: string

  @ApiProperty()
  fromState: string

  @ApiProperty()
  toState: string

  @ApiProperty()
  role: string
}
