import { ApiProperty } from '@nestjs/swagger';
import { keys as TxKeys } from 'src/types/transaction';
import { keys as UserKeys, UserExample } from 'src/types/user';
import { EthServiceExample } from 'src/types/ethService';
import { TransactionExample } from 'src/types/transaction';
import { Transaction } from 'src/types/transaction';
import { TxReceiptExample } from 'src/types/transaction/TxReceipt';
import { IsOptional, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export const MAX_TRANSACTIONS_COUNT = 50;

export class SendSignedTransactionParamInput {
  @ApiProperty({
    description: 'Transaction identifier (or txHash)',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;
}

export class SendSignedTransactionBodyInput {
  @ApiProperty({
    description: 'Signed transaction',
    example: '0x...',
  })
  signedTx: string;
}

export class SendSignedTransactionOutput {
  @ApiProperty({
    description: 'Transaction identifier',
    example: TxReceiptExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  txIdentifier: string;

  @ApiProperty({
    description: 'Response message',
    example: `Signed transaction ${
      TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID]
    } successfully sent`,
  })
  message: string;
}

export class ResendTransactionParamInput {
  @ApiProperty({
    description: 'Transaction identifier (or txHash)',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;
}

export class ResendTransactionOutput {
  @ApiProperty({
    description: 'New transaction',
    example: TransactionExample,
  })
  transaction: Transaction;

  @ApiProperty({
    description: 'Response message',
    example: `Transaction ${
      TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID]
    } successfully resent. New transaction ID is ${
      TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID]
    }.`,
  })
  message: string;
}

export class RetrieveTransactionQueryInput {
  @ApiProperty({
    description:
      'If set to false, only the transacction receipt will be retrieved. If set to true, transaction context/envelope will be retrieved as well.',
    example: true,
  })
  @IsOptional()
  withContext: boolean;

  @ApiProperty({
    description: 'Ethereum service to use to retrieve transaction receipt',
    example: JSON.stringify(EthServiceExample),
  })
  ethService: string;
}

export class RetrieveTransactionParamInput {
  @ApiProperty({
    description: 'Transaction identifier (or txHash)',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;
}

export class RetrieveTransactionOutput {
  @ApiProperty({
    description:
      "Retrieved transaction + sender's userId + transaction receipt",
    example: {
      userId: UserExample[UserKeys.USER_ID],
      ...TransactionExample,
      ...TxReceiptExample,
    },
  })
  @IsOptional()
  transaction: Transaction;

  @ApiProperty({
    description: 'Response message',
    example: `Transaction ${
      TransactionExample[TxKeys.ENV_ID]
    } successfully retrieved`,
  })
  message: string;
}

export class ListAllTransactionsQueryInput {
  @ApiProperty({
    description: 'Index of first transaction to fetch',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Max amount of transactions to fetch',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Max(MAX_TRANSACTIONS_COUNT)
  limit: number;
}

export class ListAllTransactionsOutput {
  @ApiProperty({
    description: 'Listed transactions',
    example: [TransactionExample],
  })
  @ValidateNested()
  transactions: Array<Transaction>;

  @ApiProperty({
    description: 'Number of transactions fetched',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'Total number of transactions',
    example: 543,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: '5 transactions successfully retrieved',
  })
  message: string;
}

export class UpdateTransactionOutput {
  @ApiProperty({
    description: 'Updated transaction',
    example: TransactionExample,
  })
  @IsOptional()
  transaction: Transaction;

  @ApiProperty({
    description: 'Response message',
    example: `Transaction ${
      TransactionExample[TxKeys.ENV_ID]
    } successfully updated`,
  })
  message: string;
}

export class DeleteTransactionParamInput {
  @ApiProperty({
    description: 'Transaction identifier (or txHash)',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;
}

export class DeleteTransactionOutput {
  @ApiProperty({
    description: 'Response message',
    example: `Transaction ${
      TransactionExample[TxKeys.ENV_ID]
    } successfully deleted`,
  })
  message: string;
}
