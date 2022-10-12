import {
  IsObject,
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { IsEthereumAddress } from 'src/utils/IsEthereumAddress';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const optionalBooleanMapper = new Map([
  ['undefined', undefined],
  ['true', true],
  ['false', false],
]);

export class Deployment {
  @IsString()
  @ApiProperty()
  address: string;

  @IsString()
  @ApiProperty()
  chainId: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  data: object;
}

export class TokenDto {
  @ApiProperty({
    type: String,
    required: false,
  })
  tenantId: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  issuerId: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  reviewerId: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  creatorId: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  name: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  symbol: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  standard: string;

  @IsObject()
  @ApiProperty()
  @IsOptional()
  workflowIds: object;

  @IsString()
  @ApiProperty({ required: false })
  @IsEthereumAddress()
  @IsOptional()
  defaultDeployment: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  defaultChainId: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  defaultNetworkKey: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ApiProperty({
    type: Deployment,
    isArray: true,
  })
  @IsOptional()
  deployments: Array<Deployment>;

  @IsArray()
  @ApiProperty({
    type: String,
    isArray: true,
    required: false,
  })
  @IsOptional()
  picture: Array<string>;

  @IsString()
  @ApiProperty()
  @IsOptional()
  description: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  assetTemplateId: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  assetInstanceId: string;

  @IsObject()
  @ApiProperty()
  @IsOptional()
  bankAccount: object;

  @IsArray()
  @ApiProperty({
    type: String,
    isArray: true,
  })
  @IsOptional()
  assetClasses: Array<string>;

  @IsObject()
  @ApiProperty({ required: false })
  @IsOptional()
  data: object;
}

export class FetchTokenQuery {
  @IsString()
  @ApiProperty({ required: false })
  tenantId: string | undefined;

  @IsString()
  @ApiProperty({ required: false })
  @IsOptional()
  tokenIds?: string;

  @IsUUID()
  @ApiProperty({ required: false })
  @IsOptional()
  tokenId?: string;

  @IsEthereumAddress()
  @ApiProperty({ required: false })
  @IsOptional()
  defaultDeployment?: string;

  @IsString()
  @ApiProperty({ required: false })
  @IsOptional()
  defaultChainId: string | null;

  @IsString()
  @ApiProperty({ required: false })
  @IsOptional()
  defaultNetworkKey: string | null;

  @IsString()
  @ApiProperty({ required: false })
  @IsOptional()
  name?: string;

  @IsString()
  @ApiProperty({ required: false })
  @IsOptional()
  symbol?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  offset?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => optionalBooleanMapper.get(value))
  withAssetData?: boolean;
}

export class FetchTokensQuery {
  @IsString()
  @ApiProperty({ required: false })
  tenantId: string;

  @IsString()
  @ApiProperty({ required: false })
  tokenIds: Array<string>;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => optionalBooleanMapper.get(value))
  withAssetData?: boolean;
}
