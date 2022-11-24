import { IReceipt, ITransactionContext } from '@consensys/nestjs-orchestrate'

export interface IBlockchainEventProcessor {
  eventName(): string

  onEvent(
    transactionId: string,
    receipt: IReceipt,
    txContext: ITransactionContext,
    chain: string,
    event: any,
  )

  onError(transactionId: string, error: any)
}
