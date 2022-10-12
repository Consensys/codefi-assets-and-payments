import {
  ValidateNested,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsUrl,
  IsObject,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  Network,
  FinalizedNetwork,
  FinalizedNetworkExample,
} from 'src/types/network';
import { Metadata, Products, NetworkType } from '@codefi-assets-and-payments/ts-types';

export class DeleteNetworkParamInput {
  @ApiProperty({
    description: 'Network key to delete',
    example: 'kaleido_dev_network',
  })
  key: string;
}

export class NetworksGetRequest {
  @ApiProperty({
    description: 'Network key',
    example: 'test_network_1',
  })
  @IsOptional()
  /**
   * Network key
   * @example 'test_network_1'
   */
  @IsString()
  key?: string;
}

export class NetworkBodyInput {
  @ApiProperty({
    description: 'Network name',
    example: 'Example Dev Network',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Network tenant Id',
    example: 'f9f7b631-4053-4335-9c49-65e9aca80d1e',
  })
  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @IsOptional()
  /**
   * Network key
   * @example 'test_network_1'
   */
  @IsString()
  key?: string;

  @ApiProperty({
    description: 'Network description',
    example: 'This is the example dev network description',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Network metadata',
    example: '[{ name: "metadata name", description: "metadata description" }]',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  metadata?: Metadata[];

  @IsOptional()
  /**
   * Network type
   * @example 'poa'
   */
  @IsEnum(NetworkType)
  type?: NetworkType | null = null;

  @IsOptional()
  @IsString()
  explorerUrl?: string;

  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiProperty({
    description: 'Network RCP endpoint(s)',
    example:
      '["https://e0bwzpx1vh:85Fhl87PZbBHlKSWFecxCu3j89RlOulIEJACDHZzM_U@e0yt00jvmm-e0rlauwjnb-rpc.de0-aws.kaleido.io"]',
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUrl({ require_tld: false }, { each: true })
  rpcEndpoints: string[];
  @ApiProperty({
    description: 'Network product(s)',
    example: '{assets: true, payments:true}',
  })
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  products: Products;
  @ApiProperty({
    description: 'Network name',
    example: 'Example Dev Network',
  })
  @IsBoolean()
  kafka = false;
}

export class NetworkOutput {
  network: Network;

  @ApiProperty({
    description: 'Response message',
    example: 'network listed successfully',
  })
  message: string;
}
export class ListAllNetworksOutput {
  @ApiProperty({
    description: 'Name of default network',
    example: 'Main Ethereum Network',
  })
  defaultNetwork: string;

  @ApiProperty({
    description: 'Listed networks',
    example: [
      {
        tenantId: 'codefi',
        name: 'Codefi Assets Dev Network',
        key: 'codefi_assets_dev_network',
        chainId: '118174032',
        type: 'poa',
        description:
          'Codefi Assets Dev, is a private Kaleido network setup for development',
        ethRequired: false,
        kaleido: true,
      },
      {
        tenantId: 'codefi',
        name: 'Main Ethereum Network',
        key: 'mainnet',
        chainId: '1',
        type: 'pow',
        description:
          'Frontier, Homestead, Metropolis, the Ethereum public PoW main network',
        ethRequired: true,
        kaleido: false,
      },
      {
        tenantId: 'codefi',
        name: 'Rinkeby Test Network',
        key: 'rinkeby',
        chainId: '4',
        type: 'poa',
        description: 'Rinkeby, the public Geth-only PoA testnet',
        ethRequired: true,
        kaleido: false,
      },
    ],
  })
  @ValidateNested()
  networks: Array<Network>;

  @ApiProperty({
    description: 'Response message',
    example: '5 network(s) listed successfully',
  })
  message: string;
}

export class ListNetworksOutput {
  @ApiProperty({
    description: 'Listed networks',
    example: FinalizedNetworkExample,
  })
  @ValidateNested()
  networks: Array<FinalizedNetwork>;

  @ApiProperty({
    description: 'Response message',
    example: '5 network(s) listed successfully',
  })
  message: string;
}

export class RetrieveNetworkOutput {
  @ApiProperty({
    description: 'Listed networks',
    example: FinalizedNetworkExample,
  })
  @ValidateNested()
  network: FinalizedNetwork;

  @ApiProperty({
    description: 'Response message',
    example: '5 network(s) listed successfully',
  })
  message: string;
}
