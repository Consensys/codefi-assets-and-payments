import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { EthServiceExample } from 'src/types/ethService';
import { TxStatus } from 'src/types/transaction';
import { TxReceiptExample, TxReceipt } from 'src/types/transaction/TxReceipt';
import { getEnumValues } from 'src/utils/enumUtils';

export class TriggerHookBodyInput {
  @ApiProperty({
    description: 'ID of tenant that sent the transaction',
    example: true,
  })
  tenantId: string;

  @ApiProperty({
    description:
      'Transaction identifier (can be an orchestrateId, a txHash or a ledger transaction identifier)',
    example: true,
  })
  txIdentifier: string;

  @ApiProperty({
    description: 'Transaction hash (only if transaction has been validated)',
    example: JSON.stringify(EthServiceExample),
  })
  @IsOptional()
  txHash: string;

  @ApiProperty({
    description: 'Transaction receipt (only if transaction has been validated)',
    example: TxReceiptExample,
  })
  @IsOptional()
  receipt: TxReceipt;

  @ApiProperty({
    description: `Status of the transaction, chosen amongst ${getEnumValues(
      TxStatus,
    )}`,
    example: TxStatus.VALIDATED,
  })
  @IsOptional()
  txStatus: TxStatus;

  @ApiProperty({
    description: 'Errors provided by Orchestrate',
    example: {
      error: 'insufficient gas',
    },
  })
  @IsOptional()
  errors: any;
}
