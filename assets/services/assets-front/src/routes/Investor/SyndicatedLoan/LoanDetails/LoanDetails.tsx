import {
  IToken,
  IWorkflowInstance,
  OrderSide,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import { IUser, UserType } from 'User';

import React from 'react';
import { useSelector } from 'react-redux';
import { RepaymentRequestSummary } from '../RepaymentRequest/RepaymentRequestSummary';
import { SyndicatedLoanConditionsPrecedentOverview } from '../ConditionsPrecedentOverview';
import { SyndicatedLoanOrderOverview } from '../SyndicatedLoanOrderOverview';
import { hasRole } from 'utils/HasRole';
import { isTradeOrder } from 'constants/order';
import { ClassData } from 'routes/Issuer/AssetIssuance/assetTypes';
import { userSelector } from 'features/user/user.store';

interface IProps {
  token: IToken;
  shareClass: ClassData;
  order?: IWorkflowInstance;
  assetHref: string;
  wireTransferConfirmation?: {
    filename: string;
    docId: string;
  };
  investorFee?: number;
}

export const SyndicatedLoanDetails = ({
  token,
  shareClass,
  order,
  assetHref,
  wireTransferConfirmation,
}: IProps) => {
  const user = useSelector(userSelector) as IUser;
  const isIssuerSide = hasRole(user, [UserType.ISSUER]);

  // Drawdown or Novation view
  if (order && isTradeOrder(order.name)) {
    if (order.orderSide === OrderSide.BUY) {
      return (
        <RepaymentRequestSummary
          isIssuerSide={isIssuerSide}
          isBorrowerSide={hasRole(user, [UserType.INVESTOR])}
          token={token}
          facility={shareClass}
          order={order}
          assetHref={assetHref}
        />
      );
    }
    return (
      <SyndicatedLoanOrderOverview
        token={token}
        facility={shareClass}
        order={order}
        assetHref={assetHref}
        isIssuerSide={isIssuerSide}
      />
    );
  }

  // Conditions Precedent view
  return (
    <SyndicatedLoanConditionsPrecedentOverview
      token={token}
      facility={shareClass}
      order={order}
      assetHref={assetHref}
      wireTransferConfirmation={wireTransferConfirmation}
      isIssuerSide={isIssuerSide}
    />
  );
};
