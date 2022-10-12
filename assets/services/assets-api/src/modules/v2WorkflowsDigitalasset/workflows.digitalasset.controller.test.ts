import { WorkFlowsDigitalAssetController } from './workflows.digitalasset.controller';
import { WorkFlowsPreIssuanceService } from './workflows.digitalasset.service/preIssuance';
import { WorkFlowsIndirectIssuanceService } from './workflows.digitalasset.service/indirectIssuance';
import createMockInstance from 'jest-create-mock-instance';
import { WorkFlowsDirectIssuanceService } from './workflows.digitalasset.service/directIssuance';
import { WorkFlowsFundCreationService } from './workflows.digitalasset.service/assetCreation';
import { WorkFlowsPrimaryTradeService } from './workflows.digitalasset.service/primaryTrade';
import { WorkFlowsSecondaryTradeService } from './workflows.digitalasset.service/secondaryTrade';
import { WorkFlowsNavManagementService } from './workflows.digitalasset.service/navManagement';
import { WorkFlowsOfferService } from './workflows.digitalasset.service/offer';
import { WorkFlowsEventService } from './workflows.digitalasset.service/event';

describe('WorkFlowsDigitalAssetController', () => {
  let controller: WorkFlowsDigitalAssetController;
  let workFlowsNavManagementServiceMock: WorkFlowsNavManagementService;
  let workFlowsPrimaryTradeServiceMock: WorkFlowsPrimaryTradeService;
  let workFlowsSecondaryTradeServiceMock: WorkFlowsSecondaryTradeService;
  let workFlowsAssetCreationServiceMock: WorkFlowsFundCreationService;
  let workFlowsPreIssuanceServiceMock: WorkFlowsPreIssuanceService;
  let workFlowsDirectIssuanceServiceMock: WorkFlowsDirectIssuanceService;
  let workFlowsIndirectIssuanceServiceMock: WorkFlowsIndirectIssuanceService;
  let workFlowsOfferServiceMock: WorkFlowsOfferService;
  let WorkFlowsEventServiceMock: WorkFlowsEventService;
  beforeEach(() => {
    workFlowsNavManagementServiceMock = createMockInstance(
      WorkFlowsNavManagementService,
    );
    workFlowsPrimaryTradeServiceMock = createMockInstance(
      WorkFlowsPrimaryTradeService,
    );
    workFlowsSecondaryTradeServiceMock = createMockInstance(
      WorkFlowsSecondaryTradeService,
    );
    workFlowsAssetCreationServiceMock = createMockInstance(
      WorkFlowsFundCreationService,
    );
    workFlowsPreIssuanceServiceMock = createMockInstance(
      WorkFlowsPreIssuanceService,
    );
    workFlowsDirectIssuanceServiceMock = createMockInstance(
      WorkFlowsDirectIssuanceService,
    );
    workFlowsIndirectIssuanceServiceMock = createMockInstance(
      WorkFlowsIndirectIssuanceService,
    );
    workFlowsOfferServiceMock = createMockInstance(WorkFlowsOfferService);
    WorkFlowsEventServiceMock = createMockInstance(WorkFlowsEventService);

    controller = new WorkFlowsDigitalAssetController(
      workFlowsNavManagementServiceMock,
      workFlowsPrimaryTradeServiceMock,
      workFlowsSecondaryTradeServiceMock,
      workFlowsAssetCreationServiceMock,
      workFlowsPreIssuanceServiceMock,
      workFlowsDirectIssuanceServiceMock,
      workFlowsIndirectIssuanceServiceMock,
      workFlowsOfferServiceMock,
      WorkFlowsEventServiceMock,
    );
  });

  it('KYCEssentialsLocal', async () => {
    await expect(true).toBe(true);
  });
});
