import { CycleStatus, PrimaryTradeType } from 'src/utils/constants';

export const getCycle = (assetInstanceId: string, tenantId: string) => ({
  assetInstanceClassKey: '',
  assetInstanceId,
  data: {},
  endDate: new Date(),
  nav: 1,
  settlementDate: new Date(),
  startDate: new Date(),
  status: CycleStatus.SETTLED,
  tenantId,
  type: PrimaryTradeType.REDEMPTION,
  unpaidFlagDate: new Date(),
  valuationDate: new Date(),
});
