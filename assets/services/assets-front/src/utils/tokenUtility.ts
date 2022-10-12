import { API_FETCH_TRANSACTION } from 'constants/apiRoutes';
import { AssetData } from 'routes/Issuer/AssetIssuance/assetTypes';
import {
  IToken,
  AssetType,
  AssetCycleInstance,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import { differenceBetweenTwoDates, sleep } from './commonUtils';
import { DataCall } from './dataLayer';

export const orderManagementRules = (
  asset: IToken,
  cycleId?: string,
): {
  canCreateOrder: boolean;
  canSettleOrder: boolean;
  canCancelOrder?: boolean;
  startDate?: Date;
  timeToStartDate?: string | null;
  cutOffDate?: Date;
  timeToCutOff?: string | null;
  valuationDate?: Date;
  unpaidFlagDate?: Date;
} => {
  const assetData = asset.assetData as AssetData;
  const assetType = assetData?.type;
  if (
    assetType === AssetType.PHYSICAL_ASSET ||
    assetType === AssetType.SYNDICATED_LOAN
  ) {
    return {
      canCreateOrder: true,
      canSettleOrder: true,
    };
  }

  const currentCycle = asset.cycles?.find((c) => c.id === cycleId);

  if (!currentCycle) {
    return {
      canCreateOrder: true,
      canSettleOrder: true,
    };
  }

  return {
    canCreateOrder: canCreateOrder(currentCycle),
    canSettleOrder: canSettleOrder(currentCycle),
    canCancelOrder: canCancelOrder(currentCycle),
    startDate: new Date(currentCycle.startDate as Date),
    cutOffDate: new Date(currentCycle.endDate as Date),
    valuationDate: currentCycle.valuationDate
      ? new Date(currentCycle.valuationDate as Date)
      : new Date(currentCycle.settlementDate as Date),
    unpaidFlagDate: new Date(currentCycle.unpaidFlagDate as Date),
    timeToStartDate: timeToStartDate(currentCycle),
    timeToCutOff: timeToCutOff(currentCycle),
  };
};

const canCreateOrder = (cycle: AssetCycleInstance): boolean => {
  const today = new Date().getTime();
  return (
    new Date(cycle.startDate).getTime() <= today &&
    new Date(cycle.endDate as Date).getTime() >= today
  );
};

const canCancelOrder = (cycle: AssetCycleInstance): boolean => {
  const now = new Date().getTime();
  return new Date(cycle.endDate).getTime() >= now;
};

const canSettleOrder = (cycle: AssetCycleInstance): boolean => {
  const today = new Date();
  const settlementDate = new Date(cycle.settlementDate as Date);

  return today.getTime() >= settlementDate.getTime();
};

const timeToCutOff = (cycle: AssetCycleInstance): string | null => {
  if (!canCreateOrder(cycle)) {
    return null;
  }
  const today = new Date();
  const cutOff = new Date(cycle.endDate as Date);
  const { days, hours, minutes, seconds } = differenceBetweenTwoDates(
    today,
    cutOff,
  );

  if (days > 0) {
    return `${days} days`;
  } else if (hours > 0) {
    return `${hours} hours`;
  } else if (minutes > 0) {
    return `${minutes} minutes`;
  } else {
    return `${seconds} seconds`;
  }
};

const timeToStartDate = (cycle: AssetCycleInstance): string | null => {
  const today = new Date();
  const startDate = new Date(cycle.startDate as Date);

  const { days, hours, minutes, seconds } = differenceBetweenTwoDates(
    today,
    startDate,
  );

  if (seconds < 0) {
    return null;
  }

  if (days > 0) {
    return `${days} days`;
  } else if (hours > 0) {
    return `${hours} hours`;
  } else if (minutes > 0) {
    return `${minutes} minutes`;
  } else {
    return `${seconds} seconds`;
  }
};

export const waitForTransactionResponse = async (transactionId: string) => {
  while (true) {
    try {
      const { transaction } = await DataCall({
        method: API_FETCH_TRANSACTION.method,
        path: API_FETCH_TRANSACTION.path(transactionId),
        urlParams: {
          withContext: false,
        },
      });

      if (!transaction?.status) {
        throw new Error(
          `Sending transaction resulted in invalid response format`,
        );
      }

      const { status } = transaction;
      if (status === 'pending' || status === 'processing') {
        await sleep(5000);
      } else {
        return transaction;
      }
    } catch (e: any) {
      if (e.response) {
        throw new Error(
          `Fetching transaction failed with status ${e.response.status}`,
        );
      }

      throw e;
    }
  }
};
