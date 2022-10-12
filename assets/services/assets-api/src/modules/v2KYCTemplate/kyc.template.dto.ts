import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import {
  keys as KycTemplateKeys,
  KycTemplate,
  KycTemplateExample,
  RawKycTemplate,
  RawKycTemplateExample,
  RawKycTemplateTopSection,
} from 'src/types/kyc/template';

export class ListAllTemplatesQueryInput {
  @ApiProperty({
    description:
      "If set 'true', elements are injected in the KYC template. If set to 'false', raw template is returned",
    example: false,
  })
  @IsOptional()
  includeElements: boolean;
}

export class ListAllTemplatesOutput {
  @ApiProperty({
    description: 'Name of default KYC template',
    example: KycTemplateExample[KycTemplateKeys.NAME],
  })
  defaultTemplate: string;

  @ApiProperty({
    description: 'Listed KYC templates',
    example: [KycTemplateExample],
  })
  @ValidateNested()
  templates: Array<KycTemplate | RawKycTemplate>;

  @ApiProperty({
    description: 'Response message',
    example: '5 KYC template(s) listed successfully',
  })
  message: string;
}

export class CreateTemplateBodyInput {
  @ApiProperty({
    description: 'Must be a valid issuer ID',
    example: RawKycTemplateExample[KycTemplateKeys.ISSUER_ID],
  })
  issuerId: string;

  @ApiProperty({
    description: 'Name of the KYC template',
    example: RawKycTemplateExample[KycTemplateKeys.NAME],
  })
  name: string;

  @ApiProperty({
    description: 'Top sections of the KYC template',
    example: RawKycTemplateExample[KycTemplateKeys.TOP_SECTIONS],
  })
  topSections: Array<RawKycTemplateTopSection>;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: RawKycTemplateExample[KycTemplateKeys.DATA],
  })
  data: any;
}

export class CreateTemplateOutput {
  @ApiProperty({
    description: 'Created KYC template',
    example: RawKycTemplateExample,
  })
  @ValidateNested()
  template: RawKycTemplate;

  @ApiProperty({
    description:
      "'true' if a new template has been created, 'false' if template already existed and has been retrieved",
    example: true,
  })
  newTemplate: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `KYC template ${
      RawKycTemplateExample[KycTemplateKeys.TEMPLATE_ID]
    } created successfully`,
  })
  message: string;
}

export class RetrieveTemplatesQueryInput {
  @ApiProperty({
    description:
      "If set 'true', elements are injected in the KYC template. If set to 'false', raw template is returned",
    example: false,
  })
  @IsOptional()
  includeElements: boolean;
}
export class RetrieveTemplateParamInput {
  @ApiProperty({
    description: 'ID of template to retrieve',
    example: RawKycTemplateExample[KycTemplateKeys.TEMPLATE_ID],
  })
  templateId: string;
}

export class RetrieveTemplateOutput {
  @ApiProperty({
    description: 'Retrieved KYC template',
    example: KycTemplateExample,
  })
  @ValidateNested()
  template: KycTemplate | RawKycTemplate;

  @ApiProperty({
    description: 'Response message',
    example: `KYC template ${
      RawKycTemplateExample[KycTemplateKeys.TEMPLATE_ID]
    } retrieved successfully`,
  })
  message: string;
}

export class UpdateTemplateParamInput {
  @ApiProperty({
    description: 'ID of template to retrieve',
    example: RawKycTemplateExample[KycTemplateKeys.TEMPLATE_ID],
  })
  templateId: string;
}

export class UpdateTemplateBodyInput {
  @ApiProperty({
    description: 'Template parameters to update',
    example: {
      [KycTemplateKeys.ISSUER_ID]:
        RawKycTemplateExample[KycTemplateKeys.ISSUER_ID],
      [KycTemplateKeys.NAME]: RawKycTemplateExample[KycTemplateKeys.NAME],
      [KycTemplateKeys.TOP_SECTIONS]:
        RawKycTemplateExample[KycTemplateKeys.TOP_SECTIONS],
      [KycTemplateKeys.DATA]: {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
        keyn: 'valuen',
      },
    },
  })
  updatedParameters: CreateTemplateBodyInput;
}

export class UpdateTemplateOutput {
  @ApiProperty({
    description: 'Updatesd KYC template',
    example: RawKycTemplateExample,
  })
  @ValidateNested()
  template: RawKycTemplate;

  @ApiProperty({
    description: 'Response message',
    example: `KYC template ${
      RawKycTemplateExample[KycTemplateKeys.TEMPLATE_ID]
    } updated successfully`,
  })
  message: string;
}

export class DeleteTemplateParamInput {
  @ApiProperty({
    description: 'ID of template to retrieve',
    example: RawKycTemplateExample[KycTemplateKeys.TEMPLATE_ID],
  })
  templateId: string;
}

export class DeleteTemplateOutput {
  @ApiProperty({
    description: 'Response message',
    example: `KYC template ${
      RawKycTemplateExample[KycTemplateKeys.TEMPLATE_ID]
    } deleted successfully`,
  })
  message: string;
}
