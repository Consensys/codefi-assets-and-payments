import { ApiProperty } from '@nestjs/swagger'

import { TransitionTemplateDto } from './TransitionTemplateDto'
import { WorkflowType } from '../WorkflowType'
import { EntityType, OrderSide } from '../../constants/enums'
import { IsOptional } from 'class-validator'

export class WorkflowInstanceDto {
  @ApiProperty()
  idempotencyKey: string

  @ApiProperty()
  name: string

  @ApiProperty({ enum: WorkflowType })
  workflowType: WorkflowType

  @ApiProperty()
  objectId: string

  @ApiProperty()
  state: string

  @ApiProperty()
  role: string

  @ApiProperty()
  workflowTemplateId: number

  @ApiProperty({ type: [TransitionTemplateDto] })
  transitionTemplates: TransitionTemplateDto[]

  @ApiProperty()
  userId: string

  @ApiProperty()
  recipientId: string

  @ApiProperty()
  @IsOptional()
  brokerId?: string

  @ApiProperty()
  @IsOptional()
  agentId?: string

  @ApiProperty()
  entityId: string

  @ApiProperty()
  entityType: EntityType

  @ApiProperty()
  wallet: string

  @ApiProperty()
  date: Date

  @ApiProperty()
  assetClassKey: string

  @ApiProperty()
  quantity: number

  @ApiProperty()
  price: number

  @ApiProperty()
  documentId: string

  @ApiProperty()
  paymentId: string

  @ApiProperty()
  @IsOptional()
  offerId?: number

  @ApiProperty()
  @IsOptional()
  orderSide?: OrderSide

  @ApiProperty()
  data: object
}

export class WorkflowInstanceToUpdateDto extends WorkflowInstanceDto {
  @ApiProperty()
  id: number
}
