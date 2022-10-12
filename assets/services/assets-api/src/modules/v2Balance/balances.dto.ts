import { ApiProperty } from '@nestjs/swagger';
import {
  ERC1400Balances,
  ERC1400BalancesExample,
  ERC20Balances,
  ERC721Balances,
} from 'src/types/balance';
import { IsOptional } from 'class-validator';

export class ListAllBalancesOutput {
  @ApiProperty({
    description: "User's balances for a given token",
    example: ERC1400BalancesExample,
  })
  balances: ERC20Balances | ERC721Balances | ERC1400Balances;

  @ApiProperty({
    description: 'Response message',
    example: 'Balances listed successfully',
  })
  message: string;

  @ApiProperty({
    description: "User's ETH balance",
    example: [14423256000000],
  })
  @IsOptional()
  etherBalances: Array<number>;
}
