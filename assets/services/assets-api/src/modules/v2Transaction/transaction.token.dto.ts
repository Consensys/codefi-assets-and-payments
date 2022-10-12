import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { keys as TxKeys } from 'src/types/transaction';
import { TransactionExample } from 'src/types/transaction';
import { keys as TokenKeys, TokenExample } from 'src/types/token';
import {
  ActionExample,
  Action,
} from 'src/types/workflow/workflowInstances/action';

export class MintTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the minting operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Token ${TokenExample[TokenKeys.TOKEN_ID]} minted successfully`,
  })
  message: string;
}

export class TransferTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the transfer operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Token ${
      TokenExample[TokenKeys.TOKEN_ID]
    } transferred successfully`,
  })
  message: string;
}

export class BurnTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the burn operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Token ${TokenExample[TokenKeys.TOKEN_ID]} burned successfully`,
  })
  message: string;
}

export class ForceTransferTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the transfer operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Token ${
      TokenExample[TokenKeys.TOKEN_ID]
    } transferred successfully`,
  })
  message: string;
}

export class ForceBurnTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the burn operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Token ${TokenExample[TokenKeys.TOKEN_ID]} burned successfully`,
  })
  message: string;
}

export class UpdateStateTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the updateState operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Token ${
      TokenExample[TokenKeys.TOKEN_ID]
    } state updated successfully`,
  })
  message: string;
}

export class ForceUpdateStateTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the updateState operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Token ${
      TokenExample[TokenKeys.TOKEN_ID]
    } state updated successfully`,
  })
  message: string;
}

export class UpdateClassTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the updateClass operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Token ${
      TokenExample[TokenKeys.TOKEN_ID]
    } class updated successfully`,
  })
  message: string;
}

export class HoldTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the forceHold operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: 'Token hold created successfully',
  })
  message: string;
}

export class ForceHoldTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the forceHold operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: 'Token hold created successfully',
  })
  message: string;
}

export class ExecuteHoldTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the forceHold operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: 'Token hold executed successfully',
  })
  message: string;
}

export class ReleaseHoldTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the forceHold operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: 'Token hold released successfully',
  })
  message: string;
}
