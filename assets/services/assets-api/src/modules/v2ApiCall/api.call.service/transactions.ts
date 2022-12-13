import { Injectable } from '@nestjs/common';
import { NestJSPinoLogger } from '@consensys/observability';

import ErrorService from 'src/utils/errorService';
import { ApiCallHelperService } from '.';
import { keys as TxKeys, Transaction } from 'src/types/transaction';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { TransactionEnum } from 'src/old/constants/enum';
import { HookCallBack } from 'src/types/hook';
import { TxStatus } from 'src/types/transaction';

const API_NAME = '[Workflow-API]';
const workflowHost = process.env.WORKFLOW_API;

const craftTransaction = (
  signerId: string,
  callerId: string,
  txHash: string,
  status: TxStatus,
  identifier: string,
  context: HookCallBack,
): Transaction => {
  const transaction: Transaction = {
    [TxKeys.ENV_STATUS]: status,
    [TxKeys.ENV_SIGNER_ID]: signerId,
    [TxKeys.ENV_CALLER_ID]: callerId,
    [TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID]: identifier,
    [TxKeys.ENV_IDENTIFIER_TX_HASH]: txHash,
    [TxKeys.ENV_IDENTIFIER_CUSTOM]: undefined,
    [TxKeys.ENV_CALLBACKS]: undefined,
    [TxKeys.ENV_CONTEXT]: context,
  };
  return transaction;
};

@Injectable()
export class ApiWorkflowTransactionService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly apiCallHelperService: ApiCallHelperService,
  ) {
    this.logger.setContext(ApiWorkflowTransactionService.name);
    this.workflowApi = axios.create({
      baseURL: workflowHost,
    });
  }

  private workflowApi: AxiosInstance;

  async createTransaction(
    tenantId: string,
    signerId: string,
    callerId: string,
    identifier: string,
    context: HookCallBack,
    _async: boolean,
  ): Promise<Transaction> {
    try {
      const transaction = craftTransaction(
        signerId,
        callerId,
        identifier,
        _async ? TxStatus.PENDING : TxStatus.VALIDATED,
        identifier,
        context,
      );

      this.logger.info(
        {},
        `Save transaction in DB with tenantId ${tenantId}, identifier ${identifier}, signerId ${signerId}, callerId ${callerId} \n`,
      );

      const response = await this.workflowApi.post(
        `/transactions?tenantId=${tenantId}`,
        transaction,
      );
      this.apiCallHelperService.checkRequestResponseFormat(
        'creating a transaction',
        response,
      );
      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('createTransaction', API_NAME, error, 500);
    }
  }

  async createTransactionBatch(
    tenantId: string,
    signerId: string,
    callerId: string,
    identifiers: Array<string>,
    contexts: Array<HookCallBack>,
    _async: boolean,
  ): Promise<Transaction> {
    try {
      if (identifiers.length !== contexts.length) {
        ErrorService.throwError(
          `invalid inputs for 'createTransactionBatch' function: identifiers length (${identifiers.length}) is different from contexts length (${contexts.length})`,
        );
      }
      const transactions = [];
      for (let index = 0; index < identifiers.length; index++) {
        transactions.push(
          craftTransaction(
            signerId,
            callerId,
            identifiers[index],
            _async ? TxStatus.PENDING : TxStatus.VALIDATED,
            identifiers[index],
            contexts[index],
          ),
        );
      }

      const response = await this.workflowApi.post(
        `/v2/transactions?tenantId=${tenantId}`,
        transactions,
      );
      this.apiCallHelperService.checkRequestResponseFormat(
        'creating a batch of transactions',
        response,
      );
      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('createTransaction', API_NAME, error, 500);
    }
  }

  async retrieveTransactions(
    tenantId: string,
    type?: number,
    value?: string | number,
  ): Promise<Transaction[]> {
    try {
      let suffixUrl = '';
      if (type && value) {
        if (type === TransactionEnum.index) {
          suffixUrl = `&id=${value}`;
        } else if (type === TransactionEnum.txHash) {
          suffixUrl = `&field=identifierTxHash&value=${value}`;
        } else if (type === TransactionEnum.identifier) {
          suffixUrl = `&field=identifierOrchestrateId&value=${value}`;
        } else {
          throw new Error(`Unknown key type: ${type}`);
        }
      } else if ((type && !value) || (!type && value)) {
        throw new Error(
          `You should provide either both type and value, or no one. Currently type=${type} and value=${value}.`,
        );
      }
      const requestUrl = `/transactions?tenantId=${tenantId}${suffixUrl}`;

      const response = await this.workflowApi.get(requestUrl);
      this.apiCallHelperService.checkRequestResponseFormat(
        'fetching transactions',
        response,
        true, // allowZeroLengthData
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveTransactions',
        API_NAME,
        error,
        500,
      );
    }
  }

  async updateTransaction(
    tenantId: string,
    keyType: number,
    keyValue: string | number,
    status: TxStatus,
    context: HookCallBack,
    txHash: string,
    identifier: string,
  ): Promise<Transaction> {
    try {
      this.logger.info(
        {},
        `Update transaction in DB with tenantId ${tenantId}, keyType ${keyType}, keyValue ${keyValue}, identifier ${identifier}, txHash ${txHash}, status ${status}\n`,
      );
      const fetchedTransactions: Array<Transaction> =
        await this.retrieveTransactions(tenantId, keyType, keyValue);
      if (fetchedTransactions.length > 1) {
        ErrorService.throwError(
          `shall never happen: more than 1 transaction with identifier ${keyValue} were found (${keyType})`,
        );
      } else if (fetchedTransactions.length === 0) {
        ErrorService.throwError(
          `shall never happen: no transaction with identifier ${keyValue} was found (${keyType})`,
        );
      }
      const fetchedTransaction = fetchedTransactions[0];
      const transaction: Transaction = craftTransaction(
        fetchedTransaction[TxKeys.ENV_SIGNER_ID],
        fetchedTransaction[TxKeys.ENV_CALLER_ID],
        txHash || fetchedTransaction[TxKeys.ENV_IDENTIFIER_TX_HASH],
        status || fetchedTransaction[TxKeys.ENV_STATUS],
        identifier || fetchedTransaction[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
        context || fetchedTransaction[TxKeys.ENV_CONTEXT],
      );

      const response = await this.workflowApi.put(
        `/transactions/${
          fetchedTransaction[TxKeys.ENV_ID]
        }?tenantId=${tenantId}`,
        transaction,
      );
      this.apiCallHelperService.checkRequestResponseFormat(
        'updating a transaction',
        response,
      );
      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('updateTransaction', API_NAME, error, 500);
    }
  }

  async deleteTransaction(
    tenantId: string,
    transactionId: number,
  ): Promise<AxiosResponse<number>> {
    try {
      const response = await this.workflowApi.delete(
        `/transactions/${transactionId}?tenantId=${tenantId}`,
      );
      // FIXME
      // this.apiCallHelperService.checkRequestResponseFormat(
      //   'deleting a transaction',
      //   response,
      //   true, // allowZeroLengthData
      // );
      return response;
    } catch (error) {
      ErrorService.throwApiCallError('deleteTransaction', API_NAME, error, 500);
    }
  }
}
