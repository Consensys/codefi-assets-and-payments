import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import {
  RawAssetTemplateExample,
  RawAssetTemplate,
} from 'src/types/asset/template';

export class ListAllAssetTemplatesOutput {
  @ApiProperty({
    description: 'Listed asset templates',
    example: [RawAssetTemplateExample],
  })
  @ValidateNested()
  templates: Array<RawAssetTemplate>;

  @ApiProperty({
    description: 'Response message',
    example: '5 asset template(s) listed successfully',
  })
  message: string;
}

export class RetrieveAssetTemplateParamInput {
  @ApiProperty({
    description: 'ID of asset template',
    example: RawAssetTemplateExample.id,
  })
  assetTemplateId: string;
}

export class RetrieveAssetTemplateOutput {
  @ApiProperty({
    description: 'Retrieved asset template',
    example: RawAssetTemplateExample,
  })
  @ValidateNested()
  template: RawAssetTemplate;

  @ApiProperty({
    description: 'Response message',
    example: `Asset template ${RawAssetTemplateExample.id} retrieved successfully`,
  })
  message: string;
}
