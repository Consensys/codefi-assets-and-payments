import {
  IToken,
  IWorkflowInstance,
  OrderSide,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import { getOrderType, getProductFromToken } from 'utils/commonUtils';

import { LoanFees } from 'routes/Issuer/AssetIssuance/assetTypes';

export const isTradeOrder = (orderName: string) =>
  orderName.toLowerCase().indexOf('trade') > -1 &&
  orderName.toLocaleLowerCase().indexOf('primarytrade') === -1;

export const facilityAmountDrawn = (
  facilityKey: string,
  tokenId: string,
  actions: IWorkflowInstance[],
) =>
  actions.reduce((acc: number, action) => {
    if (
      action.state === 'executed' &&
      action.orderSide === OrderSide.SELL &&
      action.assetClassKey.toLowerCase() === facilityKey.toLowerCase() &&
      action.entityId === tokenId &&
      action.data.tradeOrderType !== 'Novation'
    ) {
      acc += action.quantity;
    }
    return acc;
  }, 0);

export const facilityAmountRepaid = (
  facilityKey: string,
  tokenId: string,
  actions: IWorkflowInstance[],
) =>
  actions.reduce((acc: number, action) => {
    if (
      action.state === 'executed' &&
      action.orderSide === OrderSide.BUY &&
      action.assetClassKey.toLowerCase() === facilityKey.toLowerCase() &&
      action.entityId === tokenId
    ) {
      acc += action.quantity;
    }
    return acc;
  }, 0);

export const totalOrderAmountReceived = (token: IToken, userId: string) => {
  const actions = token.userRelatedData?.tokenActions || [];
  return actions
    .filter((action) => action.state === 'executed')
    .reduce((acc: number, action) => {
      if (action.name !== 'forceBurn') {
        if (action.recipientId === userId) {
          acc -= action.quantity;
        } else if (action.userId === userId) {
          acc += action.quantity;
        }
      }
      return acc;
    }, 0);
};

export const getOrderPaymentBreakdown = (
  token: IToken,
  order?: IWorkflowInstance,
  orderType?: string,
  fees?: number,
  amount?: number,
): { netAmount: number; tradeOrderFee: number; establishmentFee: number } => {
  const { assetType } = getProductFromToken(token);
  const isNovationOrder =
    (orderType || getOrderType(assetType, order)) === 'Novation';

  const generalAssetData = token.assetData?.asset;

  const establishmentFee = isNovationOrder
    ? 0
    : Number((generalAssetData?.fees as LoanFees).establishmentFees);

  const tradeOrderFee = fees || order?.data?.tradeOrderFee || 0;

  const netAmount = (order?.quantity || amount || 0) - establishmentFee;
  return {
    netAmount,
    tradeOrderFee,
    establishmentFee,
  };
};
