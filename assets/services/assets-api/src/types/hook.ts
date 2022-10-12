import { EthService, EthServiceExample } from './ethService';
import { LedgerTransaction } from './transaction/LedgerTransaction';
import { Web3Transaction } from './transaction/Web3Transaction';
import { OrchestrateTransaction } from './transaction/OrchestrateTransaction';
import { Wallet, WalletExample } from './wallet';
import { FunctionName, TokenCategory } from './smartContract';
import { UserType } from './user';
import { Action } from './workflow/workflowInstances/action';

export enum EmailFunctions {
  TOKEN_CREATION = 'sendIssuerTokenCreationMail',
  INVESTOR_REGISTRATION_INVITE = 'sendInvestorRegistrationInvite',
  INVESTOR_CONTRACT_SIGNATURE = 'sendInvestorContractSignature',
}

export enum keys {
  EMAIL_FUNCTIONS = 'emailFunctions',
  FUNCTION_NAME = 'functionName',
  TYPE_FUNCTION_USER = 'typeFunctionUser',
  USER_ID = 'userId',
  USERS_TO_REFRESH = 'usersToRefresh',
  TOKEN_ID = 'tokenId',
  CONTRACT_ADDRESS = 'contractAddress',
  NEXT_STATE = 'nextTokenStatus',
  NEXT_STATE2 = 'nextTokenStatus2',
  ETH_SERVICE = 'ethService',
  WALLET = 'wallet',
  RAW_TRANSACTION = 'rawTransaction',
  RESPONSE_PENDING = 'pendingTxResponseMessage',
  RESPONSE_VALIDATED = 'validatedTxResponseMessage',
  RESPONSE_FAILURE = 'failureTxResponseMessage',
  ACTION = 'action',
  ACTION2 = 'action2',
  CALL = 'call',
  CALL_PATH = 'path',
  CALL_BODY = 'body',
  TX_ERRORS = 'errors',
  TOKEN_CATEGORY = 'tokenCategory',
  CALLER_ID = 'callerId',
  SCHEDULED_ADDITIONAL_ACTION = 'scheduledAdditionalAction',
  SEND_NOTIFICATION = 'sendNotification',
  AUTH_TOKEN = 'authToken',
}
export interface HookCallBack {
  [keys.EMAIL_FUNCTIONS]: Array<string>;
  [keys.FUNCTION_NAME]: FunctionName;
  [keys.TYPE_FUNCTION_USER]: UserType;
  [keys.USERS_TO_REFRESH]: Array<string>;
  [keys.TOKEN_ID]: string;
  [keys.ETH_SERVICE]: EthService;
  [keys.NEXT_STATE]: string;
  [keys.NEXT_STATE2]?: string;
  [keys.WALLET]: Wallet;
  [keys.RESPONSE_PENDING]: string;
  [keys.RESPONSE_VALIDATED]: string;
  [keys.RESPONSE_FAILURE]: string;
  [keys.CALL]: {
    [keys.CALL_PATH]: string;
    [keys.CALL_BODY]: object;
  };
  [keys.RAW_TRANSACTION]?: // Ony useful in case of ledger transaction
  OrchestrateTransaction | LedgerTransaction | Web3Transaction;
  [keys.ACTION]?: Action;
  [keys.ACTION2]?: Action;
  [keys.CONTRACT_ADDRESS]?: string;
  [keys.TX_ERRORS]?: any;
  [keys.TOKEN_CATEGORY]?: TokenCategory; // Only required to mint initial supplies
  [keys.CALLER_ID]?: string; // Only required to mint initial supplies
  [keys.USER_ID]?: string; // Only required to mint initial supplies
  [keys.SCHEDULED_ADDITIONAL_ACTION]?: string; // Only required when an additional action shall be scheduled after transaction minting
  [keys.SEND_NOTIFICATION]?: boolean; // Only required when a send notification flag is present in the hook function
  [keys.AUTH_TOKEN]?: string; // Only required when access token needs to be stored for scheduled additional actions (transactions sent after receipt of 1st transaction)
}

export const HookCallBackExample: HookCallBack = {
  [keys.EMAIL_FUNCTIONS]: [EmailFunctions.TOKEN_CREATION],
  [keys.FUNCTION_NAME]: FunctionName.CREATE_TOKEN,
  [keys.TYPE_FUNCTION_USER]: UserType.ISSUER,
  [keys.USERS_TO_REFRESH]: ['78324893-bf7e-4699-ac04-b0beeecaaaa3'],
  [keys.TOKEN_ID]: 'a05f5ee1-32b6-4d65-af12-5b96c767e9e9',
  [keys.ETH_SERVICE]: EthServiceExample,
  [keys.NEXT_STATE]: 'executed',
  [keys.WALLET]: WalletExample,
  [keys.RESPONSE_PENDING]: 'Transaction sumbitted successfully',
  [keys.RESPONSE_VALIDATED]: 'Transaction validated',
  [keys.RESPONSE_FAILURE]: 'Transaction failed',
  [keys.CALL]: {
    [keys.CALL_PATH]: 'contract/deploy',
    [keys.CALL_BODY]: {
      contractName: 'ERC20',
      signerAddress: '',
      arguments: [],
      ethServiceType: 'orchestrate',
      chain: 'mainnet',
    },
  },
  [keys.TOKEN_CATEGORY]: TokenCategory.HYBRID,
  [keys.CALLER_ID]: '78324893-bf7e-4699-ac04-b0beeecaaaa3',
  [keys.USER_ID]: '78324893-bf7e-4699-ac04-b0beeecaaaa3',
  [keys.SCHEDULED_ADDITIONAL_ACTION]: FunctionName.UPDATE_STATE,
  [keys.SEND_NOTIFICATION]: true,
  [keys.AUTH_TOKEN]: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};
