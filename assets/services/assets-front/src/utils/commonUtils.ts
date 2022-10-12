import {
  API_GET_DOCUMENT,
  API_UPLOAD_DOCUMENT,
  RequestMethod,
} from 'constants/apiRoutes';
import {
  AssetType,
  IToken,
  ITopSection,
  IWorkflowInstance,
  IWorkflowInstanceMetadata,
  PrimaryTradeType,
  WorkflowType,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import {
  IERC1400Balances,
  ILink,
  IUser,
  IUserTokenData,
  LinkStatus,
  UserType,
} from 'User';
import {
  ElementStatus,
  ReviewStatus,
} from 'routes/Issuer/AssetIssuance/elementsTypes';

import { CommonTexts } from 'texts/commun/commonTexts';
import { DataCall } from './dataLayer';
import { IKYCSection } from 'types/KYCSection';
import { IProgress } from 'types/Progress';
import { IntlShape } from 'react-intl';
import { SubscriptionTexts } from 'texts/routes/investor/Subscription';
import { TxStatus } from 'Transaction';
import { WorkflowStates } from 'texts/routes/common/workflow';
import _ from 'lodash';
import { colors } from 'constants/styles';
import { commonActionsTexts } from 'texts/commun/actions';
import { getConfig } from './configUtils';
import { isTradeOrder } from 'constants/order';
import { AssetData, ClassData } from 'routes/Issuer/AssetIssuance/assetTypes';
import {
  CLIENT_ROUTE_ASSET_CORPORATE_ACTIONS,
  CLIENT_ROUTE_ASSET_INVESTORS,
  CLIENT_ROUTE_ASSET_OVERVIEW,
  CLIENT_ROUTE_ASSET_PRIMARY_MARKET,
  CLIENT_ROUTE_ASSET_SECONDARY_MARKET,
  CLIENT_ROUTE_ASSET_SHARECLASSES,
} from 'routesList';
import { fundInvestorsMessages } from 'texts/routes/issuer/fundInvestor';
import { fundsTexts } from 'texts/routes/issuer/funds';
import store from 'features/app.store';
import { userSelector } from 'features/user/user.store';
import moment from 'moment';

export const capitalizeFirstLetter = (label: string) => {
  if (!label) {
    return '';
  }
  return (label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()).replace(
    '_',
    ' ',
  );
};

export const download = (href: string, filename: string) => {
  const anchor = document.createElement('a');
  anchor.setAttribute('target', '_blank');
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(href);
  document.body.removeChild(anchor);
};

export const constructBlob = async (
  method: RequestMethod,
  path: string,
  urlParams?: any,
): Promise<any> => {
  return await DataCall({
    method,
    path,
    expectedResponseType: 'blob',
    urlParams,
  });
};

export const convertJsonToBlob = (obj: any): any => {
  const str = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(str);
  const blob = new Blob([bytes], {
    type: 'application/json;charset=utf-8',
  });
  return blob;
};

export const constructFileUrlFromBlob = async (
  blob: any,
  fileType: 'pdf' | 'json',
): Promise<string> => {
  return await window.URL.createObjectURL(
    new Blob([blob], { type: `application/${fileType}` }),
  );
};

export const constructFileUrl = async (
  method: RequestMethod,
  path: string,
  fileType: 'pdf' | 'json',
  urlParams?: any,
): Promise<string> => {
  try {
    const blob = await constructBlob(method, path, urlParams);
    return await constructFileUrlFromBlob(blob, fileType);
  } catch (e) {
    return '';
  }
};

export const constructCofidocsFileUrl = async (
  gdsDocId: string,
  submitterId?: string,
  issuerId?: string,
): Promise<string> => {
  const user = userSelector(store.getState()) as IUser;
  const role = user.userType;
  const method = API_GET_DOCUMENT.method;
  const path = API_GET_DOCUMENT.path(
    gdsDocId,
    role === UserType.VERIFIER ? role.toLowerCase() : undefined,
  );
  const fileType = 'pdf';
  const urlParams = {
    submitterId,
    issuerId,
  };
  return await constructFileUrl(method, path, fileType, urlParams);
};

export const getClientName = (user: IUser): string => {
  if (!user) {
    return '';
  }
  return (
    user.data?.clientName ||
    user.data?.company ||
    `${user.firstName} ${user.lastName}`
  );
};

export const getToAddress = (action: IWorkflowInstance): string => {
  if (action.wallet === action.metadata?.issuer?.defaultWallet)
    return action.metadata?.user?.defaultWallet || '';
  return action.wallet;
};

export const getActionTypeLabel = (
  intl: IntlShape,
  action: IWorkflowInstance,
  secondary: boolean,
  assetType?: AssetType,
): string => {
  const actionType = action.name;
  switch (actionType) {
    case 'forceTransfer':
    case 'transfer':
      return intl.formatMessage(commonActionsTexts.transfer);
    case 'createPrimaryTradeOrder':
    case 'validatePrimaryTradeOrder':
    case 'settleSubscriptionPrimaryTradeOrder':
    case 'rejectPrimaryTradeOrder':
      if (assetType === AssetType.SYNDICATED_LOAN) {
        return intl.formatMessage(SubscriptionTexts.conditionsPrecedent);
      }
      if (secondary) {
        return intl.formatMessage(CommonTexts.digitalisation);
      }
      if (action?.data?.tradeType === 'redemption') {
        return intl.formatMessage(CommonTexts.redemption);
      }
      return intl.formatMessage(CommonTexts.subscription);
    case 'settleRedemptionPrimaryTradeOrder':
      return intl.formatMessage(CommonTexts.redemption);
    case 'forceBurn':
      if (assetType === AssetType.SYNDICATED_LOAN)
        return intl.formatMessage(CommonTexts.loadReduction);
      if (assetType === AssetType.FIXED_RATE_BOND)
        return intl.formatMessage(CommonTexts.unitCancellation);
      return intl.formatMessage(CommonTexts.shareCancellation);
    default:
      if (isTradeOrder(actionType)) {
        if (secondary) {
          const tradeOrderType = action.data.tradeOrderType;
          if (tradeOrderType) {
            return tradeOrderType;
          }
          return intl.formatMessage(CommonTexts.drawdown);
        }
        return intl.formatMessage(CommonTexts.sell);
      }

      return intl.formatMessage(commonActionsTexts.balanceUpdate);
  }
};

export const getActionOperationSign = (
  action: IWorkflowInstance,
  value: number,
): string => {
  const actionType = action.name;
  if (value === 0) {
    return '';
  }
  switch (actionType) {
    case 'createPrimaryTradeOrder':
    case 'settlePrimaryTradeOrder':
      return action.data?.tradeType === PrimaryTradeType.REDEMPTION ? '-' : '';
    case 'burn':
    case 'forceBurn':
      return '-';
    case 'forceTransfer':
    case 'transfer':
      if (value > 0) {
        return '-';
      }
      return '+';
    default:
      return '';
  }
};

export const downloadFromCofidocs = async (
  filename: string,
  gdsDocId: string,
) => {
  const url = await constructCofidocsFileUrl(gdsDocId);
  download(url, filename);
};

export const uploadDocument = async (
  file: File,
): Promise<{
  filename: string;
  docId: string;
}> => {
  try {
    const fd = new FormData();
    fd.append('file', file);
    const {
      document: { fileName },
    } = await DataCall({
      method: API_UPLOAD_DOCUMENT.method,
      path: API_UPLOAD_DOCUMENT.path(),
      body: fd,
    });
    return {
      filename: file.name,
      docId: fileName,
    };
  } catch (err) {
    throw err;
  }
};

export const addYearsToDate = (d: Date, yearsToAdd: number) => {
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  return new Date(year + yearsToAdd, month, day);
};

export const differenceBetweenTwoDates = (
  d1: Date,
  d2: Date,
): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} => {
  // To calculate the time difference of two dates
  const differenceInTime = d2.getTime() - d1.getTime();

  // To calculate the no. of days between two dates
  const differenceInSeconds = differenceInTime / 1000;

  return {
    days: Math.floor(differenceInSeconds / (3600 * 24)),
    hours: Math.floor(differenceInSeconds / 3600),
    minutes: Math.floor(differenceInSeconds / 60),
    seconds: Math.floor(differenceInSeconds),
  };
};

export enum TimeDiffType {
  DAYS,
  HOURS,
  MINUTES,
  SECONDS,
}

export const roundedTimeDifference = (
  d1: Date,
  d2: Date,
): {
  diff: number;
  inPast: boolean;
  diffType: TimeDiffType;
} => {
  const { days, hours, minutes, seconds } = differenceBetweenTwoDates(d1, d2);
  const inPast = seconds < 0;
  const pastMultiply = inPast ? -1 : 1;
  if (days * pastMultiply > 0) {
    return {
      inPast,
      diff: days * pastMultiply,
      diffType: TimeDiffType.DAYS,
    };
  }
  if (hours * pastMultiply > 0) {
    return {
      inPast,
      diff: hours * pastMultiply,
      diffType: TimeDiffType.HOURS,
    };
  }
  if (minutes * pastMultiply > 0) {
    return {
      inPast,
      diff: minutes * pastMultiply,
      diffType: TimeDiffType.MINUTES,
    };
  }
  return {
    inPast,
    diff: seconds * pastMultiply,
    diffType: TimeDiffType.SECONDS,
  };
};

export const differenceInCalendarMonths = (d1: Date, d2: Date) => {
  const yearDiff = d1.getFullYear() - d2.getFullYear();
  const monthDiff = d1.getMonth() - d2.getMonth();

  return yearDiff * 12 + monthDiff;
};

export const computeKycProgress = (
  sections: Array<IKYCSection>,
): Array<IProgress> =>
  sections.map(({ key, label, elements }) => {
    const rejectedElements = elements.filter(
      ({ elementInstance }) =>
        elementInstance && elementInstance.status === ReviewStatus.REJECTED,
    );
    const filledElements = elements.filter(
      ({ elementInstance }) =>
        !!elementInstance && elementInstance.value.length > 0,
    ).length;
    const mandatoryItems = elements.filter(
      ({ name, element: { status, data } }) => {
        if (status === ElementStatus.mandatory) {
          return true;
        }
        if (
          status === ElementStatus.conditional &&
          (data.validation || {}).status !== ElementStatus.optional
        ) {
          const parentSection = elements.find(
            ({ element, elementInstance }) => {
              return (
                (element.inputs || []).length > 0 &&
                element.inputs.find(
                  ({ relatedElements }) =>
                    (relatedElements || []).indexOf(name) > -1 &&
                    elementInstance &&
                    (elementInstance.value || []).length > 0,
                )
              );
            },
          );

          return (
            parentSection &&
            parseInt(parentSection.elementInstance.value[0]) ===
              parentSection.element.inputs.findIndex(
                ({ relatedElements }) =>
                  relatedElements && relatedElements.indexOf(name) > -1,
              )
          );
        }
        return false;
      },
    ).length;
    return {
      key,
      label,
      started: filledElements > 0,
      complete: mandatoryItems <= filledElements,
      rejected: rejectedElements.length > 0,
      progress: `${filledElements}/${mandatoryItems}`,
    };
  });

export const combineDateAndTime = (date: Date, time: string) => {
  const formattedDate = new Date(date);
  if (time) {
    const timeHourAndMinutes = time.split(':');
    formattedDate.setHours(parseInt(timeHourAndMinutes[0]));
    formattedDate.setMinutes(parseInt(timeHourAndMinutes[1]));
  }
  return formattedDate;
};

export const isToday = (someDate: Date) => {
  const today = new Date();
  return (
    someDate.getDate() === today.getDate() &&
    someDate.getMonth() === today.getMonth() &&
    someDate.getFullYear() === today.getFullYear()
  );
};

export const getTokenCurrency = (token: IToken): string => {
  if (token) {
    const product = getProductFromToken(token);
    const shareClasses = product?.shareClasses;

    return (
      (shareClasses?.find(
        (elt) => elt.key === (token.assetClasses || [])[0],
      ) as ClassData) || {}
    ).currency;
  } else {
    return '';
  }
};

export const getEventCurrency = (event: IWorkflowInstance) => {
  if (event) {
    const token = event?.metadata?.token;
    return token?.currency;
  } else {
    return '';
  }
};

export const getAssetType = (type: AssetType, actionLabel = false): string => {
  switch (type) {
    case AssetType.CLOSED_END_FUND:
      return `${actionLabel ? 'a ' : ''} ${'Closed End Fund'}`;
    case AssetType.OPEN_END_FUND:
      return `${actionLabel ? 'an ' : ''} ${'Open End Fund'}`;
    case AssetType.PHYSICAL_ASSET:
      return `${actionLabel ? 'a ' : ''} ${'Commodity'}`;
    case AssetType.SYNDICATED_LOAN:
      return `${actionLabel ? 'a ' : ''} ${'Syndicated loan'}`;
    case AssetType.FIXED_RATE_BOND:
      return `${actionLabel ? 'a ' : ''} ${'Impact Bond'}`;
    case AssetType.CURRENCY:
      return `${actionLabel ? 'a ' : ''} ${'Currency'}`;
    default:
      return type;
  }
};

export const getAssetName = (token: IToken): string => {
  return token.assetData?.asset?.name || token.name;
};

export const getAssetSymbol = (token: IToken): string => {
  return token.assetData?.asset?.symbol || token.symbol;
};

export const getNextTransactionStatus = (data: any): string => {
  let nextTransactionStatus;
  try {
    const actionNextStatus = data.nextStatus as string;
    nextTransactionStatus = (
      data.transaction as {
        [key: string]: any;
      }
    )[actionNextStatus].status;
  } catch {
    nextTransactionStatus = '-';
  }
  return nextTransactionStatus;
};

export const titleCase = (str: string) => {
  const splitStr = str.toLowerCase().split(' ');
  for (let i = 0; i < splitStr.length; i += 1) {
    // You do not need to check if i is larger than splitStr length, as your for does that for you
    // Assign it back to the array
    splitStr[i] =
      splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  // Directly return the joined string
  return splitStr.join(' ');
};

export const computeAuM = (token: IToken): number => {
  let aum = 0;
  const product = getProductFromToken(token);
  const shareClasses = product?.shareClasses;

  if (shareClasses) {
    for (const shareClass of shareClasses) {
      const currentNav = shareClass.nav?.value || 0;
      aum += currentNav * (token.totalSupply || 0);
    }
  }
  return aum;
};

export const getTokenBalance = (token: any) => {
  return (
    (
      ((token?.investors as IUser[])[0].tokenRelatedData as IUserTokenData)
        .balances as IERC1400Balances
    )?.total || 0
  );
};

export const getUserTokenBalance = (token: IToken) => {
  return (
    ((token.userRelatedData as IUserTokenData)?.balances as IERC1400Balances)
      ?.total || 0
  );
};

export const getTokenShareClassName = (token: IToken): string => {
  const product = getProductFromToken(token);
  const shareClasses = product?.shareClasses;

  const shareClass = (shareClasses?.[0] as ClassData) || {};
  return shareClass.name || shareClass.key;
};

export const getTokenShareClassKey = (token: IToken): string => {
  const product = getProductFromToken(token);
  const shareClasses = product?.shareClasses;

  return (shareClasses?.[0] as ClassData).key;
};

export const getTokenShareClassCurrentNav = (token: IToken): number => {
  const product = getProductFromToken(token);
  if (product?.assetType === AssetType.CURRENCY) {
    return 1;
  }
  const shareClasses = product?.shareClasses;

  return (shareClasses?.[0] as ClassData)?.nav?.value || 0;
};

const getOrderState = (intl: IntlShape, state: string, secondary: boolean) => {
  switch (state) {
    case 'subscribed':
      return secondary
        ? intl.formatMessage(WorkflowStates.created)
        : intl.formatMessage(WorkflowStates.outstanding);
    case 'unpaidCancelled':
      return intl.formatMessage(WorkflowStates.canceled);
    case 'paid':
      return secondary
        ? intl.formatMessage(WorkflowStates.settling)
        : intl.formatMessage(WorkflowStates.paid);
    case 'paidRejected':
    case 'unpaidRejected':
    case 'rejected':
      return intl.formatMessage(WorkflowStates.rejected);
    default:
      return intl.formatMessage(WorkflowStates.settled);
  }
};

export const getWorkflowInstanceStatus = (
  intl: IntlShape,
  transaction: IWorkflowInstance,
  secondary: boolean,
  assetType?: AssetType,
) => {
  const nextTransactionStatus = getNextTransactionStatus(transaction.data);

  const isTradeOrSyndicatedLoan =
    isTradeOrder(transaction.name) || assetType === AssetType.SYNDICATED_LOAN;

  switch (nextTransactionStatus) {
    case TxStatus.PENDING:
    case TxStatus.PROCESSING:
      return isTradeOrSyndicatedLoan
        ? intl.formatMessage(WorkflowStates.processing)
        : intl.formatMessage(WorkflowStates.settling);
    case TxStatus.REVERTED:
    case TxStatus.FAILED:
      return intl.formatMessage(WorkflowStates.failed);
    default:
      if (isTradeOrSyndicatedLoan) {
        switch (transaction.state) {
          case 'subscribed':
          case 'submitted':
            return intl.formatMessage(WorkflowStates.submitted);
          case 'paying':
            return intl.formatMessage(WorkflowStates.pending);
          case 'paidSettled':
          case 'approved':
            return intl.formatMessage(WorkflowStates.approved);
          case 'outstanding':
            return intl.formatMessage(WorkflowStates.outstanding);
          case 'accepted':
            return intl.formatMessage(WorkflowStates.accepted);
          default:
            return getOrderState(intl, transaction.state, secondary);
        }
      }

      return getOrderState(intl, transaction.state, secondary);
  }
};

export const getWorkflowInstanceStatusStyle = (
  transaction: IWorkflowInstance,
  secondary: boolean,
): {
  background: string;
  color: string;
  border: string;
  fontWeight: number;
} => {
  const nextTransactionStatus = getNextTransactionStatus(transaction.data);

  switch (nextTransactionStatus) {
    case TxStatus.PENDING:
      return {
        background: '#F0F8FF',
        color: '#1A5AFE',
        border: `0.5px solid #1A5AFE`,
        fontWeight: 500,
      };
    case TxStatus.PROCESSING:
      return {
        background: '#F0F8FF',
        color: '#1A5AFE',
        border: `0.5px solid #1A5AFE`,
        fontWeight: 500,
      };
    case TxStatus.REVERTED:
      return {
        background: '#FCF5F5',
        color: colors.errorDark,
        border: `0.5px solid ${colors.errorDark}`,
        fontWeight: 500,
      };
    case TxStatus.FAILED:
      return {
        background: '#FCF5F5',
        color: colors.errorDark,
        border: `0.5px solid ${colors.errorDark}`,
        fontWeight: 500,
      };
    default:
      if (isTradeOrder(transaction.name)) {
        switch (transaction.state) {
          case 'submitted':
            return {
              background: '#FFF5FA',
              color: '#CC2578',
              border: '0.5px solid #CC2578',
              fontWeight: 500,
            };
          case 'accepted':
            return {
              background: '#F2FCF6',
              color: '#008055',
              border: '0.5px solid #008055',
              fontWeight: 500,
            };
          case 'approved':
            return {
              background: '#F8F7FF',
              color: '#4F53DB',
              border: '0.5px solid #4F53DB',
              fontWeight: 500,
            };
          case 'rejected':
            return {
              background: '#FCF5F5',
              color: colors.errorDark,
              border: `0.5px solid ${colors.errorDark}`,
              fontWeight: 500,
            };
          case 'outstanding':
            return {
              background: '#FFFAF7',
              color: '#CC4218',
              border: '0.5px solid #CC4218',
              fontWeight: 500,
            };
          case 'executed':
            return {
              background: '#F2FCF6',
              color: '#008055',
              border: '0.5px solid #008055',
              fontWeight: 500,
            };
          default:
            return {
              background: '#F0F8FF',
              color: '#1A5AFE',
              border: `0.5px solid #1A5AFE`,
              fontWeight: 500,
            };
        }
      }
      if (transaction.workflowType === WorkflowType.ORDER) {
        switch (transaction.state) {
          case 'paid':
            return {
              background: '#FEF7FF',
              color: '#A33AC2',
              border: '0.5px solid #A33AC2',
              fontWeight: 500,
            };
          case 'unpaidCancelled':
          case 'unpaidRejected':
          case 'paidRejected':
            return {
              background: '#FCF5F5',
              color: '#B20000',
              border: '0.5px solid #B20000',
              fontWeight: 500,
            };
          case 'subscribed':
            if (secondary) {
              return {
                background: '#FFF5FA',
                color: '#CC2578',
                border: '0.5px solid #CC2578',
                fontWeight: 500,
              };
            }
            return {
              background: '#F8F7FF',
              color: '#4F53DB',
              border: '0.5px solid #4F53DB',
              fontWeight: 500,
            };
          default:
            return {
              background: '#F2FCF6',
              color: '#008055',
              border: '0.5px solid #008055',
              fontWeight: 500,
            };
        }
      }
      if (transaction.workflowType === WorkflowType.EVENT) {
        switch (transaction.state) {
          case 'scheduled':
            return {
              background: '#F0F0F2',
              color: '#475166',
              border: '0.5px solid #475166',
              fontWeight: 500,
            };
          case 'settled':
            return {
              background: '#F2FCF6',
              color: '#008055',
              border: '0.5px solid #008055',
              fontWeight: 500,
            };
          case 'cancelled':
            return {
              background: '#FCF5F5',
              color: colors.errorDark,
              border: `0.5px solid ${colors.errorDark}`,
              fontWeight: 500,
            };
          default:
            return {
              background: '#FCF5F5',
              color: '#B20000',
              border: '0.5px solid #B20000',
              fontWeight: 500,
            };
        }
      }
      return {
        background: '#F2FCF6',
        color: '#008055',
        border: '0.5px solid #008055',
        fontWeight: 500,
      };
  }
};

export const getOrderType = (
  assetType?: AssetType,
  order?: IWorkflowInstance,
) => {
  if (assetType === AssetType.SYNDICATED_LOAN) {
    if (order?.name === 'forceBurn') {
      return 'Loan Reduction';
    }
    if (!order || !isTradeOrder(order.name)) {
      return 'Conditions Precedent';
    }

    return order.data.tradeOrderType || 'Drawdown';
  }

  return 'Issuance';
};

export const getProductFromToken = (token: IToken) => {
  const assetData = token.assetData as AssetData;
  const generalAssetData = assetData?.asset;
  // asset type
  const assetType = assetData?.type;
  // share classes
  const shareClasses = assetData?.class;
  // bank account
  const bankAccount = generalAssetData?.bankInformations || {};
  const borrowerDetails = generalAssetData?.borrowerDetails || {};
  const impactIntermediaryDetails =
    generalAssetData?.impactIntermediaryDetails || {};
  const loanGeneralDetails = generalAssetData?.loanGeneralDetails || {};
  const loanSummaryInformation = generalAssetData?.loanSummaryInformation || {};
  const loanViabilityCommercialImpact =
    generalAssetData?.loanViabilityAndCommercialImpact || {};
  const loanImpacts = generalAssetData?.loanImpacts || {};
  // description
  const bankInformation = generalAssetData?.bankInformation;
  // new bank information
  const description = generalAssetData?.description;
  // total supply
  const totalSupply = token.totalSupply;
  // default deployment
  const defaultDeployment = token.defaultDeployment;
  // asset impacts
  const impactTargetsData = generalAssetData?.impact;
  // asset prospectus
  const assetProspectus = generalAssetData?.documents?.prospectus;
  const documents = generalAssetData?.documents?.other || [];
  const commercialImpactsDocument =
    generalAssetData?.loanViabilityAndCommercialImpact?.documents;

  const impactDocument = generalAssetData?.loanImpacts?.documents;
  const assetBanner = generalAssetData?.images?.banner;
  const assetTeam = generalAssetData?.managementTeam?.team || [];
  const nav = shareClasses?.[0]?.nav?.value;

  const loanRedemptionStartDate = moment(
    new Date(
      shareClasses?.[0]?.initialRedemption?.startDate +
        ' ' +
        shareClasses?.[0]?.initialRedemption?.startHour,
    ),
  ).format('DD/MM/YYYY HH:mm:ss');
  const loanRedemptionCutOffDate = moment(
    new Date(
      shareClasses?.[0]?.initialRedemption?.cutoffDate +
        ' ' +
        shareClasses?.[0]?.initialRedemption?.cutoffHour,
    ),
  ).format('DD/MM/YYYY HH:mm:ss');
  const loanRedemptionSettlementDate = moment(
    new Date(
      shareClasses?.[0]?.initialRedemption?.settlementDate +
        ' ' +
        shareClasses?.[0]?.initialRedemption?.settlementHour,
    ),
  ).format('DD/MM/YYYY HH:mm:ss');

  return {
    description,
    assetType,
    shareClasses,
    bankAccount,
    assetProspectus,
    assetTeam,
    assetBanner,
    nav,
    totalSupply,
    defaultDeployment,
    documents,
    impactTargetsData,
    bankInformation,
    borrowerDetails,
    impactIntermediaryDetails,
    loanGeneralDetails,
    loanImpacts,
    loanSummaryInformation,
    loanViabilityCommercialImpact,
    loanRedemptionStartDate,
    loanRedemptionCutOffDate,
    loanRedemptionSettlementDate,
    impactDocument,
    commercialImpactsDocument,
  };
};

export const getAssetWalletInfoFromAssetData = (token: IToken) => {
  // "key": "wallet_information_blockchain",
  // "key": "wallet_information_walletAddress",
  const assetMetaData = token.data.assetDataDeprecated;

  const assetWalletInfo = {
    assetWalletChain: undefined,
    assetWalletAddress: undefined,
    assetWalletCryptoCurrency: undefined,
  };

  if (assetMetaData) {
    for (const [templateFieldKey, templateFieldValue] of Object.entries(
      assetMetaData,
    )) {
      const fieldValue: any = templateFieldValue;
      switch (templateFieldKey) {
        case 'id':
        case 'tenantId':
        case 'name':
        case 'type':
          assetMetaData[templateFieldKey] = fieldValue;
          break;
        case 'topSections':
          fieldValue.forEach((topSection: ITopSection) => {
            topSection.sections.forEach((section: any) => {
              section.elements.forEach((element: any) => {
                if (element.key === 'wallet_information_blockchain') {
                  assetWalletInfo.assetWalletChain = element.data[0];
                }
                if (element.key === 'wallet_information_walletAddress') {
                  assetWalletInfo.assetWalletAddress = element.data[0];
                }
                if (element.key === 'wallet_information_cryptoCurrency') {
                  assetWalletInfo.assetWalletCryptoCurrency = element.data[0];
                }
              });
            });
          });
          break;
        default:
      }
    }
  }

  return assetWalletInfo;
};

export const getLoanDataFromToken = (token: IToken) => {
  const assetData = token.assetData as AssetData;
  const generalAssetData = assetData?.asset;
  const facilities = assetData?.class;
  const termSheet = generalAssetData?.documents?.prospectus;
  const loanSyndication = generalAssetData?.typeSyndication;
  const loanSecurity = generalAssetData?.security;
  const loanTerms = generalAssetData?.terms;
  const facilityLimit = generalAssetData?.facilityLimit;
  const security = generalAssetData?.loanSecurity;
  const issuer = token.issuer;
  const legalAgreement = generalAssetData?.documents?.docusign;
  const documents = generalAssetData?.documents?.other;
  const participants = generalAssetData?.participants;
  const borrower = participants?.borrower;
  const underwriter = participants?.underwriter;
  const borrowerId = participants?.borrowerId;
  const underwriterId = participants?.underwriterId;
  const currency = facilities.find(
    (elt) => elt.key === (token?.assetClasses || [])[0],
  )?.currency;
  return {
    facilities,
    termSheet,
    documents,
    loanSyndication,
    loanSecurity,
    loanTerms,
    facilityLimit,
    security,
    legalAgreement,
    issuer,
    borrower,
    underwriter,
    borrowerId,
    underwriterId,
    currency,
  };
};

export const parseQuery = (query = ''): any => {
  const search = query.substring(1);
  try {
    return JSON.parse(
      '{"' + search.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
      function (key, value) {
        return key === '' ? value : decodeURIComponent(value);
      },
    );
  } catch (e) {
    return {};
  }
};

export const formatNumber = (number: number, locale?: string): string => {
  if (_.isNaN(number)) {
    return '-';
  }
  const config = getConfig();
  return number.toLocaleString(locale || config.locale);
};

export const formatDate = (date?: Date, locale?: string): string => {
  if (!date) {
    return '-';
  }
  const config = getConfig();
  return new Date(date).toLocaleDateString(locale || config.locale);
};

export const hasFeature = ({ features }: { features: Array<string> }) => {
  if (!features) {
    return true;
  }
  if (features.length === 0) {
    return false;
  }
  const config = getConfig();
  return features.some((feature) =>
    Boolean((config as unknown as { [key: string]: boolean })[feature]),
  );
};

const isWhiteListed = (user: IUser) => {
  const link = user.link || ({} as ILink);
  const isValidated = link.state === LinkStatus.VALIDATED;
  return isValidated;
};

export const isInvestor = (user: IUser): boolean => {
  if (user.userType !== UserType.INVESTOR) {
    return false;
  }

  return isWhiteListed(user);
};

export const isProspect = (user: IUser): boolean => {
  if (user.userType !== UserType.INVESTOR) {
    return false;
  }
  return !isInvestor(user);
};

export const isUnderwriter = (user: IUser): boolean => {
  return user.userType === UserType.UNDERWRITER;
};

export const isWhitelistedUnderwriter = (user: IUser): boolean => {
  if (user.userType !== UserType.UNDERWRITER) {
    return false;
  }

  return isWhiteListed(user);
};

export const getAtomUserType = (role: UserType, isNovationLender?: boolean) => {
  if (isNovationLender) {
    return 'Lender';
  }
  switch (role) {
    case UserType.INVESTOR:
      return 'Borrower';
    case UserType.UNDERWRITER:
      return 'Lead Arranger';
    default:
      return capitalizeFirstLetter(role);
  }
};

export const generateCode = () => {
  const alphaNum =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const idLen = 32;
  let id = '';
  for (let i = 0; i < idLen; i += 1) {
    if (i % 8 === 0 && i !== 0) {
      id += '-';
    }
    id += alphaNum.charAt(Math.floor(Math.random() * alphaNum.length));
  }
  return id;
};

export const getActionMetadata = (
  order: IWorkflowInstance,
): IWorkflowInstanceMetadata => {
  return order.metadata || {};
};

export const getUserMetadata = (
  order: IWorkflowInstance,
  assetType?: AssetType,
  issuerName?: string,
  borrowerName?: string,
): {
  name: string;
  userType: UserType;
} => {
  const orderMetadata = getActionMetadata(order);
  const userMetadata = orderMetadata.user;

  const clientName = userMetadata?.entityName;

  const firstName = userMetadata?.firstName;

  const lastName = userMetadata?.lastName;

  let name = clientName || `${firstName || '-'} ${lastName || '-'}`;

  let userType = userMetadata?.userType || UserType.INVESTOR;

  if (assetType === AssetType.SYNDICATED_LOAN) {
    if (order.data.tradeOrderType === 'Repayment' && borrowerName) {
      name = borrowerName;
      userType = UserType.INVESTOR;
    } else if (order.name === 'forceBurn' && issuerName) {
      name = issuerName;
      userType = UserType.ISSUER;
    }
  }

  return {
    name,
    userType,
  };
};

export const getRecipientMetadata = (
  order: IWorkflowInstance,
): {
  name: string | undefined;
  userType: UserType;
} => {
  const orderMetadata = getActionMetadata(order);
  const recipientMetdata = orderMetadata.recipient;
  const firstName = recipientMetdata ? recipientMetdata.firstName : '';
  const lastName = recipientMetdata ? recipientMetdata.lastName : '';
  return {
    name:
      !firstName && !lastName
        ? undefined
        : `${firstName || ''} ${lastName || ''}`,
    userType: recipientMetdata?.userType || UserType.INVESTOR,
  };
};

export const getTokenMetadata = (
  order: IWorkflowInstance,
): {
  name: string;
  currency: string;
  symbol: string;
  assetType: AssetType;
} => {
  const orderMetadata = getActionMetadata(order);
  const tokenMetadata = orderMetadata.token;
  if (!tokenMetadata) {
    return {
      name: 'unknown',
      currency: 'unknown',
      symbol: 'unknown',
      assetType: AssetType.CLOSED_END_FUND,
    };
  }
  return {
    name: tokenMetadata.name,
    currency: tokenMetadata.currency,
    symbol: tokenMetadata.symbol,
    assetType: tokenMetadata.assetType,
  };
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export enum OVERVIEW_TABS {
  OVERVIEW = 'overview',
  INVESTORS = 'investors',
  PRIMARY_MARKET = 'primaryMarket',
  LIFECYCLE_EVENTS = 'lifecycleEvents',
  SHARE_CLASSES = 'shareClasses',
  SECONDARY_MARKET = 'secondaryMarket',
}

export const getFundOverviewTabs = (
  assetId: string,
  hasMultipleShareClasses: boolean,
  type: string,
  intl: IntlShape,
  active: OVERVIEW_TABS,
) => {
  const tabs = [
    {
      label: intl.formatMessage(fundInvestorsMessages.overview),
      href: CLIENT_ROUTE_ASSET_OVERVIEW.pathBuilder({
        assetId,
      }),
      isActive: OVERVIEW_TABS.OVERVIEW === active,
    },

    {
      label: intl.formatMessage(fundInvestorsMessages.investors),
      href: CLIENT_ROUTE_ASSET_INVESTORS.pathBuilder({
        assetId,
      }),
      isActive: OVERVIEW_TABS.INVESTORS === active,
    },
    {
      label: intl.formatMessage(fundsTexts.primaryMarket),
      href: CLIENT_ROUTE_ASSET_PRIMARY_MARKET.pathBuilder({
        assetId,
      }),
      isActive: OVERVIEW_TABS.PRIMARY_MARKET === active,
    },
    {
      label: intl.formatMessage(fundsTexts.secondaryMarket),
      href: CLIENT_ROUTE_ASSET_SECONDARY_MARKET.pathBuilder({
        assetId,
      }),
      isActive: OVERVIEW_TABS.SECONDARY_MARKET === active,
    },
  ];
  if (type !== AssetType.CURRENCY)
    tabs.push({
      label: intl.formatMessage(fundInvestorsMessages.lifecycleEvents),
      href: CLIENT_ROUTE_ASSET_CORPORATE_ACTIONS.pathBuilder({
        assetId,
      }),
      isActive: OVERVIEW_TABS.LIFECYCLE_EVENTS === active,
    });
  if (hasMultipleShareClasses) {
    tabs.splice(1, 0, {
      label: intl.formatMessage(fundInvestorsMessages.shareClasses),
      href: CLIENT_ROUTE_ASSET_SHARECLASSES.pathBuilder({
        assetId,
      }),
      isActive: OVERVIEW_TABS.SHARE_CLASSES === active,
    });
  }
  return tabs;
};

export const shortifyAddress = (
  address: string,
  start: number,
  end: number,
): string => {
  return `${address.substr(0, start)}...${address.substr(
    address.length - end,
    address.length,
  )}`;
};

export const numberWithCommas = (value: number) =>
  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const isAddress = (value: string) => value.match(/^0x[a-fA-F0-9]{40}$/);
