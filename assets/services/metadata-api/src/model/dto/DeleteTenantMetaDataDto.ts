import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class DeleteTenantMetaDataDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  doNotDeleteTenantUsers: boolean;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  doNotDeleteTenantConfigs: boolean;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  doNotDeleteTenantAssetTemplates: boolean;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  doNotDeleteTenantAssetElements: boolean;
}
