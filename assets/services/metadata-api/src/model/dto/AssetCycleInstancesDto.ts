import {
  IsString,
  IsObject,
  IsOptional,
  IsNumber,
  IsDateString,
  IsIn,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CycleStatus, PrimaryTradeType } from 'src/utils/constants';

export class AssetCycleInstanceDto {
  @ApiProperty({
    type: String,
    required: false,
  })
  tenantId: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  assetInstanceId: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  assetInstanceClassKey: string;

  @IsDateString()
  @ApiProperty()
  @IsOptional()
  startDate: Date;

  @IsDateString()
  @ApiProperty()
  @IsOptional()
  endDate: Date;

  @IsDateString()
  @ApiProperty()
  @IsOptional()
  valuationDate: Date;

  @IsDateString()
  @ApiProperty()
  @IsOptional()
  settlementDate: Date;

  @IsDateString()
  @ApiProperty()
  @IsOptional()
  unpaidFlagDate: Date;

  @IsNumber()
  @ApiProperty()
  @IsOptional()
  nav: number;

  @IsIn(Object.values(CycleStatus))
  @ApiProperty({ enum: CycleStatus })
  @IsOptional()
  status: CycleStatus;

  @IsIn(Object.values(PrimaryTradeType))
  @ApiProperty({ enum: PrimaryTradeType })
  @IsOptional()
  type: PrimaryTradeType;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  data: object;
}

export class FetchAssetCycleInstanceQuery {
  @IsString()
  @ApiProperty({ required: false })
  tenantId: string;

  @IsUUID()
  @ApiProperty({ required: false })
  @IsOptional()
  cycleId: string;

  @IsString()
  @ApiProperty({ required: false })
  @IsOptional()
  assetId: string;

  @IsString()
  @ApiProperty({ required: false })
  @IsOptional()
  assetClassKey: string;

  @IsIn(Object.values(PrimaryTradeType))
  @ApiProperty({ enum: PrimaryTradeType })
  @IsOptional()
  type: PrimaryTradeType;
}
