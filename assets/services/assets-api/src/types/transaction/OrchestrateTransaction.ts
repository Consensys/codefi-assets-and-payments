import { keys } from './index';

export interface OrchestrateTransaction {
  [keys.ORCHESTRATE_OFFSET]: number;
  [keys.ORCHESTRATE_ID]: string;
}

export const OrchestrateTransactionExample: OrchestrateTransaction = {
  [keys.ORCHESTRATE_OFFSET]: 1332,
  [keys.ORCHESTRATE_ID]: '572e29cd-579c-4e15-8a50-955959f889a6',
};
