import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  UseFilters,
} from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { TransactionHelperService } from './transaction.service';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';
import {
  RetrieveTransactionOutput,
  RetrieveTransactionParamInput,
  RetrieveTransactionQueryInput,
  SendSignedTransactionParamInput,
  SendSignedTransactionBodyInput,
  SendSignedTransactionOutput,
  DeleteTransactionParamInput,
  DeleteTransactionOutput,
  ResendTransactionParamInput,
  ResendTransactionOutput,
  ListAllTransactionsOutput,
  ListAllTransactionsQueryInput,
  MAX_TRANSACTIONS_COUNT,
} from './transaction.dto';
import { keys as TxKeys } from 'src/types/transaction';

import { keys as UserKeys, UserType, User } from 'src/types/user';
import { Transaction } from 'src/types/transaction';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import {
  ApiBearerAuth,
  ApiOAuth2,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Protected } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';
import { ApiEntityCallService } from '../v2ApiCall/api.call.service/entity';

@ApiTags('Transactions')
@ApiBearerAuth('access-token')
@Controller('v2/essentials/transaction')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class TransactionController {
  constructor(
    private readonly transactionHelperService: TransactionHelperService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {}

  @Get('/:transactionId')
  @HttpCode(200)
  @ApiOAuth2(['read:transaction'])
  @ApiOperation({ summary: 'Retrieve a transaction' })
  @Protected(true, [])
  async retrieveTransaction(
    @UserContext() userContext: IUserContext,
    @Query() transactionQuery: RetrieveTransactionQueryInput,
    @Param() transactionParam: RetrieveTransactionParamInput,
  ): Promise<RetrieveTransactionOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const transaction: Transaction =
        await this.transactionHelperService.retrieveTransaction(
          userContext[UserContextKeys.TENANT_ID],
          transactionParam.transactionId,
          transactionQuery.withContext,
          true,
          true, // shallReturnResponse
        );

      if (transactionQuery.withContext) {
        if (!transaction[TxKeys.ENV_ID]) {
          ErrorService.throwError(
            `no context was found in DB for transaction with id ${transactionParam.transactionId}`,
          );
        }

        let transactionSenderId: string;
        if (transaction[TxKeys.ENV_SIGNER_ID]) {
          transactionSenderId = transaction[TxKeys.ENV_SIGNER_ID];
        } else {
          ErrorService.throwError(
            'invalid response format: missing senderId in response',
          );
        }
        const user: User = await this.apiEntityCallService.fetchEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID],
          true,
        );

        if (
          user[UserKeys.USER_TYPE] !== UserType.SUPERADMIN &&
          user[UserKeys.USER_TYPE] !== UserType.ADMIN &&
          user[UserKeys.USER_ID] !== transactionSenderId
        ) {
          ErrorService.throwError(
            `insufficient IAM rights: user ${
              userContext[UserContextKeys.USER_ID]
            } is neither the transaction sender, nor a super admin`,
          );
        }
      }

      const response: RetrieveTransactionOutput = {
        transaction: transaction,
        message: `Transaction ${transactionParam.transactionId} successfully retrieved`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving transaction',
        'retrieveTransaction',
        true,
        500,
      );
    }
  }

  @Get()
  @HttpCode(200)
  @ApiOAuth2(['read:transaction'])
  @ApiOperation({ summary: 'List all transactions' })
  @Protected(true, [])
  async listAllTransactions(
    @UserContext() userContext: IUserContext,
    @Query() transactionQuery: ListAllTransactionsQueryInput,
  ): Promise<ListAllTransactionsOutput> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);
      const tenantId = userContext[UserContextKeys.TENANT_ID];

      const offset = Number(transactionQuery.offset || 0);
      const limit: number = Math.min(
        Number(transactionQuery.limit || MAX_TRANSACTIONS_COUNT),
        MAX_TRANSACTIONS_COUNT,
      );

      const transactions: Array<Transaction> =
        await this.transactionHelperService.retrieveAllTransactions(tenantId);

      const slicedTransactionsList: Array<Transaction> = transactions.slice(
        offset,
        Math.min(offset + limit, transactions.length),
      );

      const response: ListAllTransactionsOutput = {
        transactions: slicedTransactionsList,
        count: slicedTransactionsList.length,
        total: transactions.length,
        message: `${transactions.length} transactions successfully retrieved`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving all transactions',
        'retrieveAllTransactions',
        true,
        500,
      );
    }
  }

  @Post('/:transactionId')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction'])
  @ApiOperation({ summary: 'Send a signed transaction' })
  @Protected(true, [])
  async sendSignedTransaction(
    @UserContext() userContext: IUserContext,
    @Param() transactionParam: SendSignedTransactionParamInput,
    @Body() transactionBody: SendSignedTransactionBodyInput,
  ): Promise<SendSignedTransactionOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response = this.transactionHelperService.sendSignedTransaction(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER_ID],
        transactionParam.transactionId,
        transactionBody.signedTx,
        userContext[UserContextKeys.AUTH_TOKEN],
      );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'sending signed transaction',
        'sendSignedTransaction',
        true,
        500,
      );
    }
  }

  @Post('/:transactionId/retry')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction'])
  @ApiOperation({ summary: 'Retry to send a transaction' })
  @Protected(true, [])
  async resendTransaction(
    @UserContext() userContext: IUserContext,
    @Param() transactionParam: ResendTransactionParamInput,
  ): Promise<ResendTransactionOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response = this.transactionHelperService.resendTransaction(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER_ID],
        userContext[UserContextKeys.CALLER_ID],
        transactionParam.transactionId,
        userContext[UserContextKeys.AUTH_TOKEN],
      );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'resending transaction',
        'resendTransaction',
        true,
        500,
      );
    }
  }

  @Delete('/:transactionId')
  @HttpCode(200)
  @ApiOAuth2(['delete:transaction'])
  @ApiOperation({ summary: 'Delete a transaction' })
  @Protected(true, [])
  async deleteTransaction(
    @UserContext() userContext: IUserContext,
    @Param() transactionParam: DeleteTransactionParamInput,
  ): Promise<DeleteTransactionOutput> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      const response: DeleteTransactionOutput =
        await this.transactionHelperService.deleteTransaction(
          userContext[UserContextKeys.TENANT_ID],
          transactionParam.transactionId,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting transaction',
        'deleteTransaction',
        true,
        500,
      );
    }
  }
}
