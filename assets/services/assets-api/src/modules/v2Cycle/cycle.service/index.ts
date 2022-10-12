/**
 * CYCLE HELPER FUNCTIONS
 */
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';

import { CycleEnum } from 'src/old/constants/enum';

import ErrorService from 'src/utils/errorService';

import { Injectable } from '@nestjs/common';
import {
  keys as OrderKeys,
  PrimaryTradeType,
} from 'src/types/workflow/workflowInstances';
import {
  AssetClassRule,
  assetClassRules,
  ClassData,
  ClassDataKeys,
  craftAssetCycleTemplate,
} from 'src/types/asset';

import {
  keys as CycleKeys,
  AssetCycleTemplate,
  AssetCycleInstance,
  CycleStatus,
  DAY_IN_MILLISECONDS,
} from 'src/types/asset/cycle';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { Recurrence } from 'src/types/recurrence';
import { AssetType } from 'src/types/asset/template';

@Injectable()
export class CycleService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly apiMetadataCallService: ApiMetadataCallService,
  ) {}

  /**
   * [Create new cycle when possible]
   * If start date is past, new cycle is created and returned
   * If start date is not past, return undefined
   */
  async createNewCycle(
    tenantId: string,
    assetInstanceId: string,
    assetInstanceClassKey: string,
    cycleTemplate: AssetCycleTemplate,
    type: PrimaryTradeType,
  ): Promise<AssetCycleInstance> {
    try {
      const firstStartDate: Date = cycleTemplate[
        CycleKeys.TEMPLATE_FIRST_START_DATE
      ]
        ? new Date(cycleTemplate[CycleKeys.TEMPLATE_FIRST_START_DATE])
        : undefined;

      const firstCutOffDate: Date = cycleTemplate[
        CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE
      ]
        ? new Date(cycleTemplate[CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE])
        : undefined;

      const firstValuationDate: Date = cycleTemplate[
        CycleKeys.TEMPLATE_FIRST_VALUATION_DATE
      ]
        ? new Date(cycleTemplate[CycleKeys.TEMPLATE_FIRST_VALUATION_DATE])
        : undefined;

      const firstSettlementDate: Date = cycleTemplate[
        CycleKeys.TEMPLATE_FIRST_SETTLEMENT_DATE
      ]
        ? new Date(cycleTemplate[CycleKeys.TEMPLATE_FIRST_SETTLEMENT_DATE])
        : undefined;

      const firstUnpaidFlagDate: Date = cycleTemplate[
        CycleKeys.TEMPLATE_FIRST_UNPAID_FLAG_DATE
      ]
        ? new Date(cycleTemplate[CycleKeys.TEMPLATE_FIRST_UNPAID_FLAG_DATE])
        : undefined;

      const currentDate: Date = new Date();

      if (currentDate.getTime() < firstStartDate.getTime()) {
        return undefined;
      }

      const cycleRecurrence: Recurrence =
        cycleTemplate[CycleKeys.TEMPLATE_RECURRENCE];

      let cycleStartDate: Date;
      let cycleEndDate: Date | undefined;

      if (!cycleRecurrence) {
        cycleStartDate = firstStartDate;
        if (firstCutOffDate) {
          cycleEndDate = new Date(
            cycleStartDate.getTime() +
              firstCutOffDate.getTime() -
              firstStartDate.getTime(),
          );
        }
      } else if (cycleRecurrence === Recurrence.MONTHLY) {
        cycleStartDate = this.retrieveMonthlyStartDate(
          firstStartDate,
          currentDate,
        );
        if (firstCutOffDate) {
          cycleEndDate = new Date(
            cycleStartDate.getTime() +
              firstCutOffDate.getTime() -
              firstStartDate.getTime(),
          );
        }
      } else {
        const timeSinceInitialStartDateInMilliseconds: number =
          currentDate.getTime() - firstStartDate.getTime();

        let periodLength: number;
        if (cycleRecurrence === Recurrence.DAILY) {
          periodLength = DAY_IN_MILLISECONDS;
        } else if (cycleRecurrence === Recurrence.BIDAILY) {
          periodLength = 2 * DAY_IN_MILLISECONDS;
        } else if (cycleRecurrence === Recurrence.WEEKLY) {
          periodLength = 7 * DAY_IN_MILLISECONDS;
        } else if (cycleRecurrence === Recurrence.BIWEEKLY) {
          periodLength = 14 * DAY_IN_MILLISECONDS;
        } else if (cycleRecurrence === Recurrence.NEXT_DAY) {
          periodLength =
            this.addDays(firstCutOffDate, 1).getTime() -
            firstCutOffDate.getTime();
        } else {
          ErrorService.throwError(
            `invalid cycle recurrence value (${cycleRecurrence})`,
          );
        }
        const numberOfPeriods: number = Math.floor(
          timeSinceInitialStartDateInMilliseconds / periodLength,
        );
        let totalPeriodsLength: number = numberOfPeriods * periodLength;

        cycleStartDate = new Date(
          firstStartDate.getTime() + totalPeriodsLength,
        );

        if (firstCutOffDate) {
          cycleEndDate = new Date(
            cycleStartDate.getTime() +
              firstCutOffDate.getTime() -
              firstStartDate.getTime(),
          );

          if (currentDate.getTime() > cycleEndDate.getTime()) {
            totalPeriodsLength = (numberOfPeriods + 1) * periodLength;
            cycleStartDate = new Date(
              firstStartDate.getTime() + totalPeriodsLength,
            );
            cycleEndDate = new Date(
              cycleStartDate.getTime() +
                firstCutOffDate.getTime() -
                firstStartDate.getTime(),
            );
          }
        }
      }

      const cycleValuationDate: Date = firstValuationDate
        ? new Date(
            cycleStartDate.getTime() +
              firstValuationDate.getTime() -
              firstStartDate.getTime(),
          )
        : undefined;

      const cycleSettlementDate = firstSettlementDate
        ? new Date(
            cycleStartDate.getTime() +
              firstSettlementDate.getTime() -
              firstStartDate.getTime(),
          )
        : undefined;

      const cycleUnpaidFlagDate: Date = firstUnpaidFlagDate
        ? new Date(
            cycleStartDate.getTime() +
              firstUnpaidFlagDate.getTime() -
              firstStartDate.getTime(),
          )
        : undefined;

      const newCycle: AssetCycleInstance =
        await this.apiMetadataCallService.createCycleInDB(
          tenantId,
          assetInstanceId,
          assetInstanceClassKey,
          cycleStartDate,
          cycleEndDate,
          cycleValuationDate,
          cycleSettlementDate,
          cycleUnpaidFlagDate,
          this.retrieveNewCycleStatus(cycleStartDate, cycleEndDate),
          type,
          undefined, // nav
          {}, // data
        );

      return newCycle;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'create new cycle',
        'createNewCycle',
        false,
        500,
      );
    }
  }

  /**
   * [Create initial subscription/redemption cycle]
   */
  async createInitialCycle(
    tenantId: string,
    assetInstanceId: string,
    assetClassKey: string,
    assetCycleTemplate: AssetCycleTemplate,
    type,
  ): Promise<AssetCycleInstance> {
    try {
      const startDate: Date = new Date(
        assetCycleTemplate[CycleKeys.TEMPLATE_FIRST_START_DATE],
      );

      const cutOffDate: Date = assetCycleTemplate[
        CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE
      ]
        ? new Date(assetCycleTemplate[CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE])
        : undefined;

      const valuationDate: Date = assetCycleTemplate[
        CycleKeys.TEMPLATE_FIRST_VALUATION_DATE
      ]
        ? new Date(assetCycleTemplate[CycleKeys.TEMPLATE_FIRST_VALUATION_DATE])
        : undefined;

      const settlementDate: Date = assetCycleTemplate[
        CycleKeys.TEMPLATE_FIRST_SETTLEMENT_DATE
      ]
        ? new Date(assetCycleTemplate[CycleKeys.TEMPLATE_FIRST_SETTLEMENT_DATE])
        : undefined;

      const unpaidFlagDate: Date = assetCycleTemplate[
        CycleKeys.TEMPLATE_FIRST_UNPAID_FLAG_DATE
      ]
        ? new Date(
            assetCycleTemplate[CycleKeys.TEMPLATE_FIRST_UNPAID_FLAG_DATE],
          )
        : undefined;

      const initialCycle: AssetCycleInstance =
        await this.apiMetadataCallService.createCycleInDB(
          tenantId,
          assetInstanceId,
          assetClassKey,
          startDate,
          cutOffDate,
          valuationDate,
          settlementDate,
          unpaidFlagDate,
          this.retrieveNewCycleStatus(startDate, cutOffDate),
          type,
          undefined, // nav
          {}, // data
        );

      return initialCycle;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating initial cycle',
        'createInitialCycle',
        false,
        500,
      );
    }
  }

  // BUG FIX FUNCTION - CODE TO BE REMOVED AFTER SEPTEMBER 15TH 2020
  //
  // This function was written August 17th 2020 to solve a bug on Matthias and Matthieu's accounts (StyleInvest environment)
  // Once both Matthieu and Matthias have been on the platform at least once on StyleInvest environment,
  // this function can be removed.
  //
  // Description of the bug:
  //  - In the past the bug used to create multiple versions of the same cycle object in database while there
  //    shall be only one.
  //
  async fixBugByDeletingUselessCycles(
    tenantId: string,
    cycles: Array<AssetCycleInstance>,
  ) {
    try {
      // Sort cycles according to their creation date [most recent cycle, ..., oldest cycle]
      const sortedCycles: Array<AssetCycleInstance> = cycles.sort(
        (cycle1: AssetCycleInstance, cycle2: AssetCycleInstance) => {
          const creationDate1: Date = new Date(cycle1[CycleKeys.CREATED_AT]);
          const creationDate2: Date = new Date(cycle2[CycleKeys.CREATED_AT]);
          return creationDate2.getTime() - creationDate1.getTime();
        },
      );

      // Delete all duplicate cycles except oldest one
      for (let index = 0; index < sortedCycles.length - 1; index++) {
        await this.apiMetadataCallService.deleteCycleInDB(
          tenantId,
          sortedCycles[index][CycleKeys.CYCLE_ID],
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'fixing bug by deleting useless cycles',
        'fixBugByDeletingUselessCycles',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve or create current cycle]
   */
  async retrieveOrCreateCurrentCycle(
    tenantId: string,
    assetInstanceId: string,
    assetType: AssetType,
    assetClassData: ClassData,
    tradeType: PrimaryTradeType,
  ): Promise<AssetCycleInstance> {
    try {
      if (!assetClassRules[assetType][AssetClassRule.HAS_CYCLES]) {
        return undefined;
      }

      const cycles: Array<AssetCycleInstance> =
        await this.apiMetadataCallService.retrieveCycle(
          tenantId,
          CycleEnum.assetIdAndAssetClassKeyAndType,
          assetInstanceId,
          assetClassData[ClassDataKeys.KEY],
          tradeType,
          false,
        );

      let initialCycleName: string;
      if (tradeType === PrimaryTradeType.REDEMPTION) {
        if (
          !assetClassData[PrimaryTradeType.REDEMPTION] &&
          assetType !== AssetType.OPEN_END_FUND
        ) {
          // Redemption cycles are not used for assets other than OPEN_END_FUNDs
          return undefined;
        }
        initialCycleName = ClassDataKeys.INITIAL_REDEMPTION;
      } else {
        initialCycleName = ClassDataKeys.INITIAL_SUBSCRIPTION;
      }

      // If required, create initial cycle
      if (cycles.length === 0) {
        if (!assetClassData[initialCycleName]) {
          ErrorService.throwError(
            `${initialCycleName} cycle is not defined for class ${
              assetClassData[ClassDataKeys.KEY]
            } of asset ${assetInstanceId}`,
          );
        }
        const initialCycle: AssetCycleInstance = await this.createInitialCycle(
          tenantId,
          assetInstanceId,
          assetClassData[ClassDataKeys.KEY],
          craftAssetCycleTemplate(
            assetType,
            assetClassData[initialCycleName],
            assetClassData[ClassDataKeys.PAYMENT_OPTIONS]?.[
              ClassDataKeys.PAYMENT_OPTIONS__OPTION
            ],
          ),
          tradeType,
        );
        cycles.push(initialCycle);
      }

      if (
        assetType === AssetType.PHYSICAL_ASSET ||
        assetType === AssetType.SYNDICATED_LOAN
      ) {
        if (cycles.length > 1) {
          ErrorService.throwError(
            `shall never happen: more than 1 cycle for an asset of type ${assetType} (${cycles.length} instead)`,
          );
        } else if (cycles.length === 1) {
          const refreshedCycle: AssetCycleInstance =
            await this.refreshCycleStatusIfRequired(tenantId, cycles[0]);
          return refreshedCycle;
        } else {
          ErrorService.throwError(
            `shall never happen: no cycle for asset of type ${assetType}`,
          );
        }
      } else if (
        assetType === AssetType.CLOSED_END_FUND ||
        assetType === AssetType.OPEN_END_FUND ||
        assetType === AssetType.FIXED_RATE_BOND
      ) {
        if (cycles.length < 1) {
          ErrorService.throwError(
            `shall never happen: no cycle for asset of type ${assetType}`,
          );
        }
        if (
          (assetType === AssetType.CLOSED_END_FUND ||
            assetType === AssetType.FIXED_RATE_BOND) &&
          cycles.length > 2
        ) {
          ErrorService.throwError(
            `shall never happen: more than 2 cycles for asset of type ${AssetType.CLOSED_END_FUND} or ${AssetType.FIXED_RATE_BOND}`,
          );
        }

        // This sorts cycles array: [oldest cycle, ..., newest cycle]
        const sortedCycles: Array<AssetCycleInstance> = cycles.sort(
          (a: AssetCycleInstance, b: AssetCycleInstance) => {
            const timestampA: number = new Date(
              a[CycleKeys.START_DATE],
            ).getTime(); // TO_BE_TESTED for OPEN_END_FUNDS
            const timestampB: number = new Date(
              b[CycleKeys.START_DATE],
            ).getTime(); // TO_BE_TESTED for OPEN_END_FUNDS
            return timestampA - timestampB;
          },
        );

        const filteredCycles: Array<AssetCycleInstance> = sortedCycles.filter(
          (cycle: AssetCycleInstance) => {
            return (
              cycle[CycleKeys.STATUS] === CycleStatus.NOT_STARTED ||
              cycle[CycleKeys.STATUS] === CycleStatus.SUBSCRIPTION_STARTED
            );
          },
        );

        let currentCycle: AssetCycleInstance;
        if (filteredCycles.length !== 0) {
          for (let index = 0; index < filteredCycles.length; index++) {
            const cycle: AssetCycleInstance =
              await this.refreshCycleStatusIfRequired(
                tenantId,
                filteredCycles[index],
              );

            if (
              cycle[CycleKeys.STATUS] === CycleStatus.NOT_STARTED ||
              cycle[CycleKeys.STATUS] === CycleStatus.SUBSCRIPTION_STARTED
            ) {
              currentCycle = cycle;
              break;
            }
          }
        }

        const cycleName =
          tradeType === PrimaryTradeType.SUBSCRIPTION
            ? ClassDataKeys.SUBSCRIPTION
            : ClassDataKeys.REDEMPTION;
        if (!(currentCycle && currentCycle[CycleKeys.CYCLE_ID])) {
          if (
            assetType === AssetType.CLOSED_END_FUND ||
            assetType === AssetType.FIXED_RATE_BOND
          ) {
            if (
              assetClassData[cycleName] &&
              assetClassData[cycleName].startDate &&
              sortedCycles.length < 2
            ) {
              // In case the asset is a closed-end fund, and the subsequent cycle is defined,
              // create cycle when required (e.g. when there are less than 2 cycles)
              const cycleTemplate = craftAssetCycleTemplate(
                assetType,
                assetClassData[cycleName],
                assetClassData[ClassDataKeys.PAYMENT_OPTIONS]?.[
                  ClassDataKeys.PAYMENT_OPTIONS__OPTION
                ],
              );
              currentCycle = await this.createNewCycle(
                tenantId,
                assetInstanceId,
                assetClassData[ClassDataKeys.KEY],
                cycleTemplate,
                tradeType,
              );
            }
          } else if (assetType === AssetType.OPEN_END_FUND) {
            // In case the asset is an open-end fund, the subsequent cycle is mandatory
            if (!assetClassData[cycleName]) {
              ErrorService.throwError(
                `${tradeType} cycle is not defined for class ${
                  assetClassData[ClassDataKeys.KEY]
                } of asset ${assetInstanceId}`,
              );
            }
            // create new cycle
            currentCycle = await this.createNewCycle(
              tenantId,
              assetInstanceId,
              assetClassData[ClassDataKeys.KEY],
              craftAssetCycleTemplate(
                assetType,
                assetClassData[cycleName],
                assetClassData[ClassDataKeys.PAYMENT_OPTIONS]?.[
                  ClassDataKeys.PAYMENT_OPTIONS__OPTION
                ],
              ),
              tradeType,
            );
          } else {
            ErrorService.throwError(`unexpected asset type: ${assetType}`);
          }

          if (!(currentCycle && currentCycle[CycleKeys.CYCLE_ID])) {
            // return newest cycle (even if subscritptions are already closed)
            currentCycle = sortedCycles[sortedCycles.length - 1];
          }
        }

        return currentCycle;
      } else {
        ErrorService.throwError(
          `invalid asset type: cycles can only be created/retrieved for assets of type ${AssetType.PHYSICAL_ASSET}, ${AssetType.CLOSED_END_FUND}, ${AssetType.OPEN_END_FUND}, ${AssetType.SYNDICATED_LOAN} or ${AssetType.FIXED_RATE_BOND}`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving or creating current cycle',
        'retrieveOrCreateCurrentCycle',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve cycle ID]
   */
  retrieveCycleId(workflowInstance): string {
    try {
      if (
        !(
          workflowInstance[OrderKeys.OBJECT_ID] // contains Cycle ID
        )
      ) {
        ErrorService.throwError(
          `shall never happen: missing cycle ID in order ${
            workflowInstance[OrderKeys.ID]
          }}`,
        );
      }
      const cycleId: string = workflowInstance[OrderKeys.OBJECT_ID];

      return cycleId;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving cycle ID',
        'retrieveCycleId',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve monthly start date]
   */
  retrieveMonthlyStartDate(firstStartDate: Date, currentDate: Date): Date {
    try {
      let cycleStartDate: Date;

      const dayOfMonth = firstStartDate.getDate();
      const hours = firstStartDate.getHours();
      const minutes = firstStartDate.getMinutes();
      const seconds = firstStartDate.getSeconds();
      const millis = firstStartDate.getMilliseconds();

      const tempDateDec: Date = new Date(
        currentDate.getFullYear() - 1,
        11,
        dayOfMonth,
        hours,
        minutes,
        seconds,
        millis,
      );
      const tempDateJan: Date = new Date(
        currentDate.getFullYear(),
        0,
        dayOfMonth,
        hours,
        minutes,
        seconds,
        millis,
      );

      let startDateFound = false;
      if (
        tempDateDec.getTime() < currentDate.getTime() &&
        currentDate.getTime() < tempDateJan.getTime()
      ) {
        cycleStartDate = tempDateDec;
        startDateFound = true;
      } else {
        for (let month = 0; month < 12; month++) {
          const tempDate1: Date = new Date(
            currentDate.getFullYear(),
            month,
            dayOfMonth,
            hours,
            minutes,
            seconds,
            millis,
          );
          const tempDate2: Date = new Date(
            month !== 11 // month=11 for decembre
              ? currentDate.getFullYear()
              : currentDate.getFullYear() + 1,
            month !== 11 ? month + 1 : 0,
            dayOfMonth,
            hours,
            minutes,
            seconds,
            millis,
          );
          if (
            tempDate1.getTime() < currentDate.getTime() &&
            currentDate.getTime() < tempDate2.getTime()
          ) {
            cycleStartDate = tempDate1;
            startDateFound = true;
            break;
          }
        }
      }

      if (!startDateFound) {
        ErrorService.throwError(
          'shall never happen: start date not found, error in algorithm',
        );
      }

      return cycleStartDate;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'refreshing monthly start date',
        'retrieveMonthlyStartDate',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieeve new cycle status]
   */
  retrieveNewCycleStatus(startDate: Date, endDate?: Date): CycleStatus {
    try {
      const currentdate = new Date();
      let newCycleSatus: CycleStatus;

      if (currentdate.getTime() <= startDate.getTime()) {
        newCycleSatus = CycleStatus.NOT_STARTED;
      } else if (!endDate || currentdate.getTime() <= endDate.getTime()) {
        newCycleSatus = CycleStatus.SUBSCRIPTION_STARTED;
      } else {
        newCycleSatus = CycleStatus.SUBSCRIPTION_ENDED;
      }
      return newCycleSatus;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving new cycle status',
        'retrieveNewCycleStatus',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve next cycle start date (only for open-end funds)]
   */
  retrieveNextCycleStartDate(
    cycle: AssetCycleInstance,
    cycleRecurrence: Recurrence,
  ): Date {
    try {
      if (!cycleRecurrence) {
        ErrorService.throwError(
          'shall never happen: recurrence shall always be defined for an open-end fund',
        );
      }

      if (!cycle[CycleKeys.START_DATE]) {
        ErrorService.throwError(
          `missing start date in cycle with ID ${cycle[CycleKeys.CYCLE_ID]}`,
        );
      }

      const currentStartDate: Date = cycle[CycleKeys.START_DATE];
      const currentEndDate: Date = cycle[CycleKeys.END_DATE];
      let nextStartDate: Date;

      if (cycleRecurrence === Recurrence.MONTHLY) {
        const month = currentStartDate.getMonth();
        const dayOfMonth = currentStartDate.getDate();
        const hours = currentStartDate.getHours();
        const minutes = currentStartDate.getMinutes();
        const seconds = currentStartDate.getSeconds();
        const millis = currentStartDate.getMilliseconds();

        nextStartDate = new Date(
          month !== 11 // month=11 for decembre
            ? currentStartDate.getFullYear()
            : currentStartDate.getFullYear() + 1,
          month !== 11 ? month + 1 : 0,
          dayOfMonth,
          hours,
          minutes,
          seconds,
          millis,
        );
      } else {
        let periodLength: number;
        if (cycleRecurrence === Recurrence.DAILY) {
          periodLength = DAY_IN_MILLISECONDS;
        } else if (cycleRecurrence === Recurrence.BIDAILY) {
          periodLength = 2 * DAY_IN_MILLISECONDS;
        } else if (cycleRecurrence === Recurrence.WEEKLY) {
          periodLength = 7 * DAY_IN_MILLISECONDS;
        } else if (cycleRecurrence === Recurrence.BIWEEKLY) {
          periodLength = 14 * DAY_IN_MILLISECONDS;
        } else if (cycleRecurrence === Recurrence.NEXT_DAY) {
          periodLength =
            this.addDays(new Date(currentEndDate), 1).getTime() -
            new Date(currentEndDate).getTime();
        }
        nextStartDate = new Date(
          new Date(currentStartDate).getTime() + periodLength,
        );
      }

      return nextStartDate;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving next cycle start date',
        'retrieveNextCycleStartDate',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve initial subscription cycle template]
   */
  retrieveInitialSubscriptionCycleTemplate(
    assetType: AssetType,
    assetClassData: ClassData,
  ): AssetCycleTemplate {
    try {
      if (!assetClassData[ClassDataKeys.INITIAL_SUBSCRIPTION]) {
        ErrorService.throwError(
          `missing ${
            ClassDataKeys.INITIAL_SUBSCRIPTION
          } for assetclass with key ${assetClassData[ClassDataKeys.KEY]}`,
        );
      }
      return craftAssetCycleTemplate(
        assetType,
        assetClassData[ClassDataKeys.INITIAL_SUBSCRIPTION],
        assetClassData[ClassDataKeys.PAYMENT_OPTIONS]?.[
          ClassDataKeys.PAYMENT_OPTIONS__OPTION
        ],
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving initial subscription cycle template',
        'retrieveInitialSubscriptionCycleTemplate',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve initial redemption cycle template]
   */
  retrieveInitialRedemptionCycleTemplate(
    assetType: AssetType,
    assetClassData: ClassData,
  ): AssetCycleTemplate {
    try {
      if (!assetClassData[ClassDataKeys.INITIAL_REDEMPTION]) {
        ErrorService.throwError(
          `missing ${
            ClassDataKeys.INITIAL_REDEMPTION
          } for assetclass with key ${assetClassData[ClassDataKeys.KEY]}`,
        );
      }
      return craftAssetCycleTemplate(
        assetType,
        assetClassData[ClassDataKeys.INITIAL_REDEMPTION],
        assetClassData[ClassDataKeys.PAYMENT_OPTIONS]?.[
          ClassDataKeys.PAYMENT_OPTIONS__OPTION
        ],
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving initial redemption cycle template',
        'retrieveInitialRedemptionCycleTemplate',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve subsequent subscription cycle template]
   */
  retrieveSubsequentSubscriptionCycleTemplate(
    assetType: AssetType,
    assetClassData: ClassData,
  ): AssetCycleTemplate {
    try {
      if (!assetClassData[ClassDataKeys.SUBSCRIPTION]) {
        ErrorService.throwError(
          `missing ${ClassDataKeys.SUBSCRIPTION} for assetclass with key ${
            assetClassData[ClassDataKeys.KEY]
          }`,
        );
      }
      return craftAssetCycleTemplate(
        assetType,
        assetClassData[ClassDataKeys.SUBSCRIPTION],
        assetClassData[ClassDataKeys.PAYMENT_OPTIONS]?.[
          ClassDataKeys.PAYMENT_OPTIONS__OPTION
        ],
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving subsequent subscription cycle template',
        'retrieveSubsequentSubscriptionCycleTemplate',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve subsequent redemption cycle template]
   */
  retrieveSubsequentRedemptionCycleTemplate(
    assetType: AssetType,
    assetClassData: ClassData,
  ): AssetCycleTemplate {
    try {
      if (!assetClassData[ClassDataKeys.REDEMPTION]) {
        ErrorService.throwError(
          `missing ${ClassDataKeys.REDEMPTION} for assetclass with key ${
            assetClassData[ClassDataKeys.KEY]
          }`,
        );
      }
      return craftAssetCycleTemplate(
        assetType,
        assetClassData[ClassDataKeys.REDEMPTION],
        assetClassData[ClassDataKeys.PAYMENT_OPTIONS]?.[
          ClassDataKeys.PAYMENT_OPTIONS__OPTION
        ],
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving subsequent redemption cycle template',
        'retrieveSubsequentRedemptionCycleTemplate',
        false,
        500,
      );
    }
  }

  /**
   * [Check if cycle is initial subscription cycle]
   */
  isInitialSubscriptionCycle(
    assetType: AssetType,
    cycle: AssetCycleInstance,
    assetClassData: ClassData,
  ) {
    try {
      const initialCycleTemplate: AssetCycleTemplate =
        this.retrieveInitialSubscriptionCycleTemplate(
          assetType,
          assetClassData,
        );

      if (
        initialCycleTemplate[CycleKeys.TEMPLATE_FIRST_START_DATE].getTime() ===
        new Date(cycle[CycleKeys.START_DATE]).getTime()
      ) {
        if (!initialCycleTemplate[CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE]) {
          // End date is not always defined. Example: there is not end date for assets of type PHYSICAL_ASSET or SYNDICATED_LOAN
          return true;
        } else if (
          initialCycleTemplate[
            CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE
          ].getTime() === new Date(cycle[CycleKeys.END_DATE]).getTime()
        ) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if cycle is inititial',
        'isInitialSubscriptionCycle',
        false,
        500,
      );
    }
  }

  /**
   * [Refresh cycle status if required]
   */
  async refreshCycleStatusIfRequired(
    tenantId: string,
    cycle: AssetCycleInstance,
  ): Promise<AssetCycleInstance> {
    try {
      const startDate: Date = this.retrieveCycleDate(
        cycle,
        CycleKeys.START_DATE,
      );
      // End date can be undefined, in case there's no end date (for example for physical assets)
      const endDate: Date = this.retrieveCycleDate(cycle, CycleKeys.END_DATE);

      if (endDate && !(startDate.getTime() <= endDate.getTime())) {
        // TO_BE_TESTED
        ErrorService.throwError(
          `shall never happen: problem with cycle data: start date (${startDate.getTime()}) is larger than end date (${endDate.getTime()})`,
        );
      }

      const newStatus: CycleStatus = this.retrieveNewCycleStatus(
        startDate,
        endDate,
      );

      let updatedCycle: AssetCycleInstance;
      if (newStatus && newStatus !== cycle[CycleKeys.STATUS]) {
        updatedCycle = await this.apiMetadataCallService.updateCycleInDB(
          tenantId,
          cycle[CycleKeys.CYCLE_ID],
          {
            [CycleKeys.STATUS]: newStatus,
          },
        );
      }

      return updatedCycle ? updatedCycle : cycle;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'refreshing cycle status if required',
        'refreshCycleStatusIfRequired',
        false,
        500,
      );
    }
  }

  /**
   * [Get cycle date if defined]
   */
  retrieveCycleDate(cycle: AssetCycleInstance, dateKey: string): Date {
    try {
      if (
        dateKey !== CycleKeys.START_DATE &&
        dateKey !== CycleKeys.END_DATE &&
        dateKey !== CycleKeys.VALUATION_DATE &&
        dateKey !== CycleKeys.SETTLEMENT_DATE &&
        dateKey !== CycleKeys.UNPAID_FLAG_DATE
      ) {
        ErrorService.throwError(`invalid date key: ${dateKey}`);
      }

      if (cycle[dateKey]) {
        return new Date(cycle[dateKey]);
      } else {
        return undefined;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'getting cycle date',
        'retrieveCycleDate',
        false,
        500,
      );
    }
  }

  /**
   * [Delete cycles if any]
   */
  async deleteAllTokenCycles(
    tenantId: string,
    tokenId: string,
  ): Promise<Array<string>> {
    try {
      const cycles: Array<AssetCycleInstance> =
        await this.apiMetadataCallService.retrieveCycle(
          tenantId,
          CycleEnum.assetId,
          tokenId,
          undefined,
          undefined,
          false,
        );

      const cylclesToDeleteIds: Array<string> = cycles.map(
        (cycle: AssetCycleInstance) => {
          return cycle[CycleKeys.CYCLE_ID];
        },
      );

      await Promise.all(
        cylclesToDeleteIds.map((cycleId: string) => {
          return this.apiMetadataCallService.deleteCycleInDB(tenantId, cycleId);
        }),
      );

      return cylclesToDeleteIds;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting all token cycles',
        'deleteAllTokenCycles',
        false,
        500,
      );
    }
  }

  /**
   * [Check cycles consistency]
   */
  checkCyclesConsistency(
    initialSubscriptionCycleTemplate: AssetCycleTemplate,
    subsequentSubscriptionCycleTemplate: AssetCycleTemplate,
  ): boolean {
    try {
      if (subsequentSubscriptionCycleTemplate) {
        const initialCutOffDate: Date = new Date(
          initialSubscriptionCycleTemplate[
            CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE
          ],
        );
        const subsequentStartDate: Date = new Date(
          subsequentSubscriptionCycleTemplate[
            CycleKeys.TEMPLATE_FIRST_START_DATE
          ],
        );
        if (initialCutOffDate.getTime() > subsequentStartDate.getTime()) {
          ErrorService.throwError(
            `subsequent cycle (${subsequentStartDate}) can not start before the end of initial cycle (${initialCutOffDate})`,
          );
        }
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking cycles consistency',
        'checkCyclesConsistency',
        false,
        500,
      );
    }
  }

  /**
   * [Update initial cycle if possible]
   */
  async updateInitialCycleIfPossible(
    tenantId: string,
    tokenId: string,
    assetClassKey: string,
    initialCycleTemplate: AssetCycleTemplate,
    newInitialCycleTemplate: AssetCycleTemplate,
  ): Promise<AssetCycleTemplate> {
    try {
      const currentDate: Date = new Date();

      const firstStartDate: Date = new Date(
        initialCycleTemplate[CycleKeys.TEMPLATE_FIRST_START_DATE],
      );
      const firstCutOffDate: Date = new Date(
        initialCycleTemplate[CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE],
      );
      const firstValuationDate: Date = new Date(
        initialCycleTemplate[CycleKeys.TEMPLATE_FIRST_VALUATION_DATE],
      );
      const firsSettlementDate: Date = new Date(
        initialCycleTemplate[CycleKeys.TEMPLATE_FIRST_SETTLEMENT_DATE],
      );
      const firstUnpaidFlagDate: Date = new Date(
        initialCycleTemplate[CycleKeys.TEMPLATE_FIRST_UNPAID_FLAG_DATE],
      );

      let newStartDate: Date;
      if (newInitialCycleTemplate[CycleKeys.TEMPLATE_FIRST_START_DATE]) {
        newStartDate = new Date(
          newInitialCycleTemplate[CycleKeys.TEMPLATE_FIRST_START_DATE],
        );
      }
      const updatedStartDate: Date = newStartDate
        ? newStartDate
        : firstStartDate;

      let newCutOffDate: Date;
      if (newInitialCycleTemplate[CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE]) {
        newCutOffDate = new Date(
          newInitialCycleTemplate[CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE],
        );
      }
      const updatedCutOffDate: Date = newCutOffDate
        ? newCutOffDate
        : firstCutOffDate;

      let newValuationDate: Date;
      if (newInitialCycleTemplate[CycleKeys.TEMPLATE_FIRST_VALUATION_DATE]) {
        newValuationDate = new Date(
          newInitialCycleTemplate[CycleKeys.TEMPLATE_FIRST_VALUATION_DATE],
        );
      }
      const updatedValuationDate: Date = newValuationDate
        ? newValuationDate
        : firstValuationDate;

      let newSettlementDate: Date;
      if (newInitialCycleTemplate[CycleKeys.TEMPLATE_FIRST_SETTLEMENT_DATE]) {
        newSettlementDate = new Date(
          newInitialCycleTemplate[CycleKeys.TEMPLATE_FIRST_SETTLEMENT_DATE],
        );
      }
      const updatedSettlementDate: Date = newSettlementDate
        ? newSettlementDate
        : firsSettlementDate;

      let newUnpaidFlagDate: Date;
      if (newInitialCycleTemplate[CycleKeys.TEMPLATE_FIRST_UNPAID_FLAG_DATE]) {
        newUnpaidFlagDate = new Date(
          newInitialCycleTemplate[CycleKeys.TEMPLATE_FIRST_UNPAID_FLAG_DATE],
        );
      }
      const updatedUnpaidFlagDate: Date = newUnpaidFlagDate
        ? newUnpaidFlagDate
        : firstUnpaidFlagDate;

      if (
        newStartDate ||
        newCutOffDate ||
        newValuationDate ||
        newSettlementDate ||
        newUnpaidFlagDate
      ) {
        if (newStartDate) {
          if (currentDate.getTime() > firstStartDate.getTime()) {
            ErrorService.throwError(
              `start date can not be modified once initial start date (${firstStartDate}) is past`,
            );
          } else if (currentDate.getTime() > updatedStartDate.getTime()) {
            ErrorService.throwError(
              `new start date can not be in the past (${updatedStartDate})`,
            );
          }
        }

        if (newCutOffDate) {
          if (currentDate.getTime() > firstCutOffDate.getTime()) {
            ErrorService.throwError(
              `cut-off date can not be modified once initial cut-off date (${firstCutOffDate}) is past`,
            );
          } else if (currentDate.getTime() > updatedCutOffDate.getTime()) {
            ErrorService.throwError(
              `new cut-off date can not be in the past (${updatedCutOffDate})`,
            );
          }
        }

        if (newValuationDate) {
          if (currentDate.getTime() > firstValuationDate.getTime()) {
            ErrorService.throwError(
              `valuation date can not be modified once initial valuation date (${firstValuationDate}) is past`,
            );
          } else if (currentDate.getTime() > updatedValuationDate.getTime()) {
            ErrorService.throwError(
              `new valuation date can not be in the past (${updatedValuationDate})`,
            );
          }
        }

        if (newSettlementDate) {
          if (currentDate.getTime() > firsSettlementDate.getTime()) {
            ErrorService.throwError(
              `settlement date can not be modified once initial settlement date (${firsSettlementDate}) is past`,
            );
          } else if (currentDate.getTime() > updatedSettlementDate.getTime()) {
            ErrorService.throwError(
              `new settlement date can not be in the past (${updatedSettlementDate})`,
            );
          }
        }

        if (newUnpaidFlagDate) {
          if (currentDate.getTime() > firstUnpaidFlagDate.getTime()) {
            ErrorService.throwError(
              `unpaid flag date can not be modified once initial unpaid flag date (${firstUnpaidFlagDate}) is past`,
            );
          } else if (currentDate.getTime() > updatedUnpaidFlagDate.getTime()) {
            ErrorService.throwError(
              `new unpaid flag date can not be in the past (${updatedUnpaidFlagDate})`,
            );
          }
        }

        if (updatedStartDate.getTime() > updatedCutOffDate.getTime()) {
          ErrorService.throwError(
            `start date (${updatedStartDate}) can not be after cut-off date (${updatedCutOffDate})`,
          );
        } else if (
          updatedCutOffDate.getTime() > updatedValuationDate.getTime()
        ) {
          ErrorService.throwError(
            `cut-off date (${updatedCutOffDate}) can not be after valuation date (${updatedValuationDate})`,
          );
        } else if (
          updatedValuationDate.getTime() > updatedSettlementDate.getTime()
        ) {
          ErrorService.throwError(
            `valuation date (${updatedValuationDate}) can not be after settlement date (${updatedSettlementDate})`,
          );
        } else if (
          updatedSettlementDate.getTime() > updatedUnpaidFlagDate.getTime()
        ) {
          ErrorService.throwError(
            `settlement date (${updatedSettlementDate}) can not be after unpaid flag date (${updatedUnpaidFlagDate})`,
          );
        }

        const cycles: Array<AssetCycleInstance> =
          await this.apiMetadataCallService.retrieveCycle(
            tenantId,
            CycleEnum.assetIdAndAssetClassKey,
            tokenId,
            assetClassKey,
            undefined,
            false,
          );
        const filteredCycles: Array<AssetCycleInstance> = cycles.filter(
          (cycle: AssetCycleInstance) => {
            const startDate: Date = new Date(cycle[CycleKeys.START_DATE]);
            return firstStartDate.getTime() === startDate.getTime();
          },
        );

        if (filteredCycles.length > 0) {
          this.logger.info(
            {},
            `cycle instance has already been created: it needs to be updated: ${
              filteredCycles[0][CycleKeys.CYCLE_ID]
            }`,
          );
          // In case the cycle instance had already been created in the DB, it needs to be modified as well
          await this.apiMetadataCallService.updateCycleInDB(
            tenantId,
            filteredCycles[0][CycleKeys.CYCLE_ID],
            {
              ...filteredCycles[0],
              [CycleKeys.START_DATE]: updatedStartDate,
              [CycleKeys.END_DATE]: updatedCutOffDate,
              [CycleKeys.VALUATION_DATE]: updatedValuationDate,
              [CycleKeys.SETTLEMENT_DATE]: updatedSettlementDate,
              [CycleKeys.UNPAID_FLAG_DATE]: updatedUnpaidFlagDate,
            },
          );
        } else {
          this.logger.info(
            {},
            'cycle instance has not been created so far: no cycle instance to update',
          );
        }

        return {
          ...initialCycleTemplate,
          [CycleKeys.TEMPLATE_FIRST_START_DATE]: updatedStartDate,
          [CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE]: updatedCutOffDate,
          [CycleKeys.TEMPLATE_FIRST_VALUATION_DATE]: updatedValuationDate,
          [CycleKeys.TEMPLATE_FIRST_SETTLEMENT_DATE]: updatedSettlementDate,
          [CycleKeys.TEMPLATE_FIRST_UNPAID_FLAG_DATE]: updatedUnpaidFlagDate,
        };
      } else {
        return initialCycleTemplate;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating initilal cycle if possible',
        'updateInitialCycleIfPossible',
        false,
        500,
      );
    }
  }

  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
