import {
  IToken,
  IWorkflowInstance,
  OrderSide,
} from 'routes/Issuer/AssetIssuance/templatesTypes';

import { differenceInCalendarMonths } from 'utils/commonUtils';
import { isTradeOrder } from 'constants/order';
import {
  ClassData,
  combineDateAndTime,
  LoanFees,
} from 'routes/Issuer/AssetIssuance/assetTypes';

export const getRemainingRepaymentAmountToLender = (
  actions: IWorkflowInstance[],
  recipientId: string,
) => {
  const totalRepayment =
    actions.reduce((acc, action) => {
      if (isTradeOrder(action.name) && action.state === 'executed') {
        if (action.recipientId === recipientId) {
          acc += action.quantity;
        } else if (action.userId === recipientId) {
          acc -= action.quantity;
        }
      }
      return acc;
    }, 0) || 0;

  const repaidAmount =
    actions?.reduce((acc, action) => {
      if (
        action.orderSide === OrderSide.BUY &&
        action.state === 'executed' &&
        action.recipientId === recipientId
      ) {
        acc += (action.price || 0) * (action.quantity || 1);
      }
      return acc;
    }, 0) || 0;

  return totalRepayment - repaidAmount;
};

export const getRepaymentBreakdown = (
  token: IToken,
  facility: ClassData,
  order?: IWorkflowInstance,
  requestRepaymentAmount?: number,
) => {
  const repaymentAmount =
    requestRepaymentAmount || (order?.price || 0) * (order?.quantity || 1);

  const totalInterestRate = Math.round(
    ((Number(facility.interest.margin) + 0.9) * 10000) / 10000,
  );

  const orderDate = order?.createdAt
    ? new Date(order.createdAt || '')
    : new Date();

  const startDate = combineDateAndTime(
    facility.initialSubscription.startDate,
    facility.initialSubscription.startHour,
  );
  const cutoffDate = combineDateAndTime(
    facility.initialSubscription.cutoffDate,
    facility.initialSubscription.cutoffHour,
  );
  const utilisationDate = new Date(startDate || '');

  const earlyRepaymentFee =
    orderDate.getTime() <= new Date(cutoffDate || '').getTime()
      ? Number((token.assetData?.asset?.fees as LoanFees)?.trusteeFees)
      : 0;

  const repaymentLag = differenceInCalendarMonths(orderDate, utilisationDate);

  // Repayment Amount x Total Interest Rate x Months between Utilisation Date and Repayment Date
  const repaymentInterest =
    ((repaymentAmount * totalInterestRate) / 100) *
    (repaymentLag > 1 ? repaymentLag : 1);

  const totalRepaymentAmount = repaymentAmount
    ? repaymentAmount + repaymentInterest + earlyRepaymentFee
    : 0;

  return {
    repaymentAmount,
    totalInterestRate,
    earlyRepaymentFee,
    repaymentInterest,
    totalRepaymentAmount,
    utilisationDate,
  };
};
