import { IReceipt } from 'pegasys-orchestrate/lib/kafka/types/IReceipt'
import { ITransactionContext } from 'pegasys-orchestrate/lib/kafka/types/ITransactionContext'

export interface IConsumerListener {
  onMessage(
    transactionId: string,
    receipt: IReceipt,
    txContext: ITransactionContext,
    chain: string,
    contextLabels: Record<string, any>,
  )
  onError(transactionId: string, error: any)
  onStopConsumer()
}
