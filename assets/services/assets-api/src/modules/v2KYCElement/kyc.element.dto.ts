import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import {
  keys as KycElementKeys,
  KycElement,
  KycElementExample,
  KycElementInput,
  ElementType,
  ElementStatus,
} from 'src/types/kyc/element';
import { TranslatedString } from 'src/types/languages';

export class ListAllElementsOutput {
  @ApiProperty({
    description: 'Listed KYC elements',
    example: [KycElementExample],
  })
  @ValidateNested()
  elements: Array<KycElement>;

  @ApiProperty({
    description: 'Response message',
    example: '5 KYC element(s) listed successfully',
  })
  message: string;
}

export class CreateElementOutput {
  @ApiProperty({
    description: 'Created KYC elements',
    example: [
      {
        element: KycElementExample,
        newElement: true,
      },
    ],
  })
  @ValidateNested()
  elements: Array<{
    element: KycElement;
    newElement: boolean;
  }>;

  @ApiProperty({
    description: 'Response message',
    example: '5 KYC element(s) created successfully',
  })
  message: string;
}

export class RetrieveElementParamInput {
  @ApiProperty({
    description: 'ID of KYC element to retrieve',
    example: KycElementExample[KycElementKeys.ELEMENT_ID],
  })
  elementId: string;
}

export class RetrieveElementOutput {
  @ApiProperty({
    description: 'Retrieved KYC elements',
    example: KycElementExample,
  })
  @ValidateNested()
  element: KycElement;

  @ApiProperty({
    description: 'Response message',
    example: `KYC element ${
      KycElementExample[KycElementKeys.ELEMENT_ID]
    } retrieved successfully`,
  })
  message: string;
}

export class UpdateElementParamInput {
  @ApiProperty({
    description: 'ID of KYC element to update',
    example: KycElementExample[KycElementKeys.ELEMENT_ID],
  })
  elementId: string;
}

export class UpdateElementBodyInput {
  @ApiProperty({
    description: 'Element parameters to update',
    example: [
      {
        [KycElementKeys.ELEMENT_KEY]:
          KycElementExample[KycElementKeys.ELEMENT_KEY],
        [KycElementKeys.ELEMENT_TYPE]:
          KycElementExample[KycElementKeys.ELEMENT_TYPE],
        [KycElementKeys.ELEMENT_STATUS]:
          KycElementExample[KycElementKeys.ELEMENT_STATUS],
        [KycElementKeys.ELEMENT_LABEL]:
          KycElementExample[KycElementKeys.ELEMENT_LABEL],
        [KycElementKeys.ELEMENT_PLACEHOLDER]:
          KycElementExample[KycElementKeys.ELEMENT_PLACEHOLDER],
        [KycElementKeys.ELEMENT_INPUTS]:
          KycElementExample[KycElementKeys.ELEMENT_INPUTS],
        [KycElementKeys.ELEMENT_DATA]: {
          key1: 'value1',
          key2: 'value2',
          key3: 'value3',
          keyn: 'valuen',
        },
      },
    ],
  })
  updatedParameters: Array<{
    [KycElementKeys.ELEMENT_KEY]?: string;
    [KycElementKeys.ELEMENT_TYPE]?: ElementType;
    [KycElementKeys.ELEMENT_STATUS]?: ElementStatus;
    [KycElementKeys.ELEMENT_LABEL]?: TranslatedString;
    [KycElementKeys.ELEMENT_PLACEHOLDER]?: TranslatedString;
    [KycElementKeys.ELEMENT_INPUTS]?: Array<KycElementInput>;
    [KycElementKeys.ELEMENT_DATA]?: any;
  }>;
}

export class UpdateElementOutput {
  @ApiProperty({
    description: 'Updated KYC elements',
    example: KycElementExample,
  })
  @ValidateNested()
  element: KycElement;

  @ApiProperty({
    description: 'Response message',
    example: `KYC element ${
      KycElementExample[KycElementKeys.ELEMENT_ID]
    } updated successfully`,
  })
  message: string;
}

export class DeleteElementParamInput {
  @ApiProperty({
    description: 'ID of KYC element to delete',
    example: KycElementExample[KycElementKeys.ELEMENT_ID],
  })
  elementId: string;
}

export class DeleteElementOutput {
  @ApiProperty({
    description: 'Response message',
    example: `KYC element ${
      KycElementExample[KycElementKeys.ELEMENT_ID]
    } deleted successfully`,
  })
  message: string;
}
