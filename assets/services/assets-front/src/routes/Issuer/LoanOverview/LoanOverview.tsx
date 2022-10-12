import './LoanOverviewStyles.scss';

import { useSelector, useDispatch } from 'react-redux';
import {
  AssetType,
  IToken,
  IWorkflowInstance,
  OrderSide,
  WorkflowType,
} from '../AssetIssuance/templatesTypes';
import {
  CLIENT_ROUTE_ASSETS,
  CLIENT_ROUTE_ASSET_OVERVIEW_INFOS,
  CLIENT_ROUTE_INVESTMENT_PRODUCTS,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_DRAWDOWN,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_NOVATION,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_REPAYMENT,
  CLIENT_ROUTE_INVESTOR_SUBSCRIPTION_ORDER,
  CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID,
} from 'routesList';
import { HasRole, hasRole } from 'utils/HasRole';
import { IUser, UserType } from 'User';
import { IntlShape, WrappedComponentProps, injectIntl } from 'react-intl';
import {
  capitalizeFirstLetter,
  differenceInCalendarMonths,
  formatDate,
  getActionOperationSign,
  getAtomUserType,
  getLoanDataFromToken,
  getOrderType,
  getProductFromToken,
  getTokenCurrency,
  getUserMetadata,
  getClientName,
  getWorkflowInstanceStatus,
  getWorkflowInstanceStatusStyle,
} from 'utils/commonUtils';
import {
  facilityAmountDrawn,
  facilityAmountRepaid,
  isTradeOrder,
} from 'constants/order';

import { API_UPDATE_USER } from 'constants/apiRoutes';
import Button from 'uiComponents/Button';
import { Card } from 'uiComponents/Card';
import { CommonTexts } from 'texts/commun/commonTexts';
import { DataCall } from 'utils/dataLayer';
import InputFile from 'uiComponents/InputFile';
import { Link } from 'react-router-dom';
import { NavigationAction } from 'uiComponents/PageTitle/PageTitle';
import PageTitle from 'uiComponents/PageTitle';
import React, { useState } from 'react';
import { TablePaginated } from 'uiComponents/TablePaginated/TablePaginated';
import _ from 'lodash';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { assetIssuanceMessages } from 'texts/routes/issuer/assetIssuance';
import { colors } from 'constants/styles';
import { currencyFormat } from 'utils/currencyFormat';
import { getRepaymentBreakdown } from 'routes/Investor/SyndicatedLoan/RepaymentRequest/repaymentUtils';
import { loanOverviewMessages } from 'texts/routes/issuer/loanOverview';
import { mdiInformation } from '@mdi/js';
import { orderManagementRules } from 'utils/tokenUtility';
import {
  ClassData,
  combineDateAndTime,
  Document,
  Docusign,
  LoanSecurity,
} from '../AssetIssuance/assetTypes';
import { setAppModal, setUser, userSelector } from 'features/user/user.store';

interface IProps extends WrappedComponentProps {
  token: IToken;
  actions: Array<IWorkflowInstance>;
}

type IState = { userSignedAgreement?: boolean };

const getActionTooltip = (token: IToken, intl: IntlShape) => {
  const { canCreateOrder, timeToCutOff, timeToStartDate } =
    orderManagementRules(token);
  if (canCreateOrder && timeToCutOff) {
    return intl.formatMessage(loanOverviewMessages.timeTillSubscriptionEnd, {
      time: timeToCutOff,
    });
  }
  if (!canCreateOrder && !timeToStartDate) {
    return intl.formatMessage(loanOverviewMessages.subscriptionClosed, {
      time: timeToCutOff,
    });
  }
  if (!canCreateOrder && timeToStartDate) {
    return intl.formatMessage(loanOverviewMessages.subscriptionStartsIn, {
      time: timeToStartDate,
    });
  }
  return undefined;
};

const LoanOverviewClass: React.FC<IProps> = ({ intl, token, actions }) => {
  const [state, setState] = useState<IState>({ userSignedAgreement: false });
  const user = useSelector(userSelector) as IUser;
  const dispatch = useDispatch();

  const buildTabNavigationActions = (
    user: IUser,
    token: IToken,
    actions: Array<IWorkflowInstance>,
    facilities: Array<ClassData>,
    legalAgreement: any,
  ): Array<NavigationAction> => {
    const { canCreateOrder } = orderManagementRules(token);
    const { assetType } = getProductFromToken(token as IToken);
    const { borrowerId, underwriterId } = getLoanDataFromToken(token as IToken);

    const signedLoanAgreements = user.data?.loanAgreementsSigned || [];

    const isContractParticipant =
      user.id === borrowerId ||
      user.id === underwriterId ||
      user.id === token.issuer?.id;

    const signLoanAgreement = {
      label: intl.formatMessage(loanOverviewMessages.signLoanAgreement),
      style:
        state.userSignedAgreement ||
        (assetType === AssetType.SYNDICATED_LOAN && !isContractParticipant) ||
        signedLoanAgreements.includes(token.id)
          ? { display: 'none' }
          : undefined,
      action: () => {
        dispatch(
          setAppModal(
            appModalData({
              title: intl.formatMessage(loanOverviewMessages.signLoanAgreement),
              confirmAction: async () => {
                window.open(legalAgreement[2]);

                if (assetType === AssetType.SYNDICATED_LOAN) {
                  const userLoanAgreementsSigned = [
                    ...signedLoanAgreements,
                    token.id,
                  ];

                  await DataCall({
                    method: API_UPDATE_USER.method,
                    path: API_UPDATE_USER.path(user.id),
                    body: {
                      updatedParameters: {
                        data: {
                          loanAgreementsSigned: userLoanAgreementsSigned,
                        },
                      },
                    },
                  });

                  dispatch(
                    setUser({
                      ...user,
                      data: {
                        ...user.data,
                        loanAgreementsSigned: userLoanAgreementsSigned,
                      },
                    }),
                  );

                  setState({
                    userSignedAgreement: true,
                  });
                }
              },
              confirmLabel: intl.formatMessage(
                loanOverviewMessages.continueToDocSign,
              ),
              confirmColor: colors.main,
              content: (
                <div
                  style={{
                    width: 480,
                    fontSize: '16px',
                    lineHeight: '150%',
                    color: '#4A4A4A',
                  }}
                >
                  {intl.formatMessage(
                    loanOverviewMessages.continueToDocSignDesc,
                  )}
                </div>
              ),
            }),
          ),
        );
      },
    };
    switch (user.userType) {
      case UserType.ISSUER:
        return [
          {
            label: intl.formatMessage(loanOverviewMessages.viewLoanInformation),
            icon: mdiInformation,
            secondary: true,
            href: CLIENT_ROUTE_ASSET_OVERVIEW_INFOS.pathBuilder({
              assetId: token.id,
            }),
          },
          signLoanAgreement,
        ];
      case UserType.INVESTOR:
        if (actions.length === 0) {
          return [
            {
              label: intl.formatMessage(
                loanOverviewMessages.confirmConditionsPrecedent,
              ),
              disabled: !canCreateOrder,
              title: getActionTooltip(token, intl),
              href: CLIENT_ROUTE_INVESTOR_SUBSCRIPTION_ORDER.pathBuilder({
                assetId: token.id,
                classKey: facilities[0].key,
              }),
            },
            signLoanAgreement,
          ];
        }
        return [];
      default:
        return [signLoanAgreement];
    }
  };

  const buildDocuments = (
    otherDocs: Array<Document> = [],
    termSheet: Document,
    security?: LoanSecurity,
    legalAgreement?: Docusign,
  ) => {
    const documents = _.chain(otherDocs)
      .flatten()
      .concat(security?.documents || [])
      .value();

    let docusignUrl = '';

    if (termSheet) {
      documents.push({
        name: intl.formatMessage(loanOverviewMessages.termSheet),
        key: termSheet.key,
      });
    }

    if (legalAgreement) {
      documents.push({
        name: intl.formatMessage(loanOverviewMessages.loanFacilityAgreement),
        key: legalAgreement.key,
      });

      docusignUrl = legalAgreement.url;
    }

    const documentsSplitter = documents.length / 2;
    const rightDocs = documents.slice(0, documentsSplitter);
    const leftDocs = documents.slice(documentsSplitter);
    return {
      rightDocs,
      leftDocs,
      docusignUrl,
    };
  };

  const {
    termSheet,
    facilities,
    loanSyndication,
    loanSecurity,
    loanTerms,
    facilityLimit,
    security,
    legalAgreement,
    issuer,
    borrower,
    borrowerId,
    underwriter,
    underwriterId,
    documents,
  } = getLoanDataFromToken(token);
  const { assetType } = getProductFromToken(token as IToken);

  const { rightDocs, leftDocs, docusignUrl } = buildDocuments(
    documents,
    termSheet,
    security,
    legalAgreement,
  );
  const loanUtilization = _.ceil(
    (facilities.reduce((acc, facility) => {
      acc += facilityAmountDrawn(facility.name, token.id, actions);
      return acc;
    }, 0) /
      facilities.reduce((acc, facility) => {
        acc += facility.facilityAmount;
        return acc;
      }, 0)) *
      100,
    2,
  );

  const facilityRecipientList = actions
    .filter(
      (action) =>
        isTradeOrder(action.name) &&
        action.orderSide === OrderSide.SELL &&
        !!action.recipientId &&
        action.recipientId !== underwriterId,
    )
    .reduce(
      (acc, action) => {
        if (!acc.find((recipient) => recipient.id === action.recipientId)) {
          acc = [
            ...acc,
            {
              id: action.recipientId,
              ...action.metadata?.recipient,
            } as IUser,
          ];
        }
        return acc;
      },

      [underwriter as IUser],
    );

  const facilitiesTotalAmount = facilities.reduce((acc, facility) => {
    acc += facility.facilityAmount;
    return acc;
  }, 0);

  const facilityRecipientAllocation = (recipientId: string) => {
    if (recipientId === underwriterId && !actions.length) {
      return facilitiesTotalAmount;
    }

    return actions.reduce((acc, action) => {
      if (isTradeOrder(action.name) && action.state === 'executed') {
        if (action.orderSide === OrderSide.SELL) {
          if (action.recipientId === recipientId) {
            acc += action.quantity;
          } else if (action.userId === recipientId) {
            acc -= action.quantity;
          }
        } else if (action.orderSide === OrderSide.BUY) {
          if (action.recipientId === recipientId) {
            acc += action.quantity;
          } else if (action.userId === recipientId) {
            acc -= action.quantity;
          }
        }
      }
      return acc;
    }, 0);
  };

  const facilitiesData = facilities.map((facility) => {
    const amountDrawn = facilityAmountDrawn(facility.name, token.id, actions);
    const amountRepaid = facilityAmountRepaid(facility.name, token.id, actions);

    const amountOutstanding = amountDrawn ? amountDrawn - amountRepaid : 0;

    const loanDuration =
      assetType === AssetType.SYNDICATED_LOAN
        ? differenceInCalendarMonths(
            new Date(
              combineDateAndTime(
                facility.initialSubscription.cutoffDate,
                facility.initialSubscription.cutoffHour,
              ) || '',
            ),
            new Date(
              combineDateAndTime(
                facility.initialSubscription.startDate,
                facility.initialSubscription.startHour,
              ) || '',
            ),
          ) || 1
        : 0;

    return {
      name: facility.name,
      amount: currencyFormat(
        facility.facilityAmount || 0,
        getTokenCurrency(token),
      ),
      amountCommitted: '100%',
      amountDrawn: currencyFormat(amountDrawn, getTokenCurrency(token)),
      originalAmountDrawn: amountDrawn,
      amountUnDrawn: currencyFormat(
        facility.facilityAmount - amountDrawn,
        getTokenCurrency(token),
      ),
      amountRepaid: currencyFormat(amountRepaid, getTokenCurrency(token)),
      amountOutstanding: currencyFormat(
        amountOutstanding,
        getTokenCurrency(token),
      ),
      startDate: formatDate(
        combineDateAndTime(
          facility.initialSubscription.startDate,
          facility.initialSubscription.startHour,
        ),
      ),

      duration: intl.formatMessage(CommonTexts.monthsPlurals, {
        count: loanDuration,
      }),
      endDate: formatDate(
        combineDateAndTime(
          facility.initialSubscription.cutoffDate,
          facility.initialSubscription.cutoffHour,
        ),
      ),
      facility,
      underwriter,
    };
  });

  const transactionsData = actions.map((transaction) => {
    const quantity =
      !isTradeOrder(transaction.name) &&
      transaction.name !== 'forceBurn' &&
      assetType === AssetType.SYNDICATED_LOAN
        ? 1
        : transaction.quantity;
    let amount = transaction.price * quantity;

    if (
      assetType === AssetType.SYNDICATED_LOAN &&
      transaction.data.tradeOrderType === 'Repayment'
    ) {
      amount = getRepaymentBreakdown(
        token,
        facilities[0],
        transaction,
      ).totalRepaymentAmount;
    }

    let issuerName;
    let borrowerName;

    if (
      (assetType === AssetType.SYNDICATED_LOAN &&
        isTradeOrder(transaction.name)) ||
      transaction.name === 'forceBurn'
    ) {
      issuerName = getClientName(token.issuer as IUser);
      borrowerName = getClientName(borrower as IUser);
    }

    const { name, userType } = getUserMetadata(
      transaction,
      assetType,
      issuerName,
      borrowerName,
    );

    const transactionUser = transaction.metadata?.user;

    return {
      transaction,
      name,
      role: getAtomUserType(
        userType,
        underwriterId !== transactionUser?.id &&
          borrowerId !== transactionUser?.id,
      ),
      type: getOrderType(assetType, transaction),
      amount: `${getActionOperationSign(transaction, amount)}${currencyFormat(
        amount,
        getTokenCurrency(token),
      )}`,
      date: formatDate(new Date(transaction.date)),
    };
  });

  const facilityRecipientData = facilityRecipientList.map(
    (facilityUser: IUser, idx: number) => {
      const facilitiesAllocation = facilityRecipientAllocation(facilityUser.id);

      const amountDrawn = facilityAmountDrawn(
        facilities[0].name,
        token.id,
        actions,
      );
      const amountRepaid = facilityAmountRepaid(
        facilities[0].name,
        token.id,
        actions,
      );

      const amountOutstanding = amountDrawn ? amountDrawn - amountRepaid : 0;
      return {
        name: getClientName(facilityUser),
        role: getAtomUserType(
          facilityUser.userType,
          underwriterId !== facilityUser.id && borrowerId !== facilityUser.id,
        ),
        allocation: currencyFormat(
          facilitiesAllocation,
          getTokenCurrency(token),
        ),
        facilityKey: facilities[0].key,
        userId: facilityUser.id,
        percentage:
          _.round((facilitiesAllocation / amountOutstanding) * 100, 2) + '%',
      };
    },
  );

  return (
    <div className="_route_issuer_loanOverview">
      <PageTitle
        title={token.name}
        backLink={{
          label: intl.formatMessage(loanOverviewMessages.allAssets),
          to: hasRole(user, [UserType.INVESTOR, UserType.UNDERWRITER])
            ? CLIENT_ROUTE_INVESTMENT_PRODUCTS
            : CLIENT_ROUTE_ASSETS,
        }}
        tabActions={buildTabNavigationActions(
          user,
          token,
          actions,
          facilities,
          legalAgreement,
        )}
      />

      <main>
        <div className="indicators">
          <Card>
            <header>
              {intl.formatMessage(loanOverviewMessages.facilityLimit)}
            </header>
            <div>
              {currencyFormat(facilityLimit as number, getTokenCurrency(token))}
            </div>
          </Card>
          <Card>
            <header>
              {assetType === AssetType.SYNDICATED_LOAN
                ? intl.formatMessage(loanOverviewMessages.loanUtilization)
                : intl.formatMessage(loanOverviewMessages.loanUtilization)}
            </header>
            <div>{loanUtilization}%</div>
          </Card>
          {assetType === AssetType.SYNDICATED_LOAN ? (
            <>
              <Card>
                <header>
                  {intl.formatMessage(loanOverviewMessages.borrower)}
                </header>
                <div>{getClientName(borrower as IUser)}</div>
              </Card>
              <Card>
                <header>
                  {intl.formatMessage(loanOverviewMessages.leadArranger)}
                </header>
                <div>{getClientName(underwriter as IUser)}</div>
              </Card>
            </>
          ) : (
            <>
              <HasRole
                user={user}
                roles={[UserType.ISSUER, UserType.UNDERWRITER]}
              >
                <Card>
                  <header>
                    {intl.formatMessage(loanOverviewMessages.borrower)}
                  </header>
                  <div>{getClientName(borrower as IUser)}</div>
                </Card>
              </HasRole>
              <HasRole user={user} roles={[UserType.INVESTOR]}>
                <Card>
                  <header>
                    {intl.formatMessage(loanOverviewMessages.leadArranger)}
                  </header>
                  <div>{getClientName(underwriter as IUser)}</div>
                </Card>
              </HasRole>
            </>
          )}
          <Card>
            <header>
              {intl.formatMessage(loanOverviewMessages.facilityAgent)}
            </header>
            <div>{getClientName(issuer as IUser)}</div>
          </Card>
        </div>
        {facilities.length > 0 && (
          <>
            <br />
            <br />
            <TablePaginated
              tableSettingsId="loadOverviewFacilities"
              defaultColumnsHidden={[]}
              TableTitle={intl.formatMessage(
                loanOverviewMessages.facilitiesListTitle,
              )}
              hidePagination
              data={facilitiesData}
              columns={[
                {
                  Header: intl.formatMessage(
                    loanOverviewMessages.facilitiesListHeaderFacilityName,
                  ),
                  disableSortBy: true,
                  accessor: 'name',
                },
                {
                  Header: intl.formatMessage(
                    loanOverviewMessages.facilitiesListHeaderAmount,
                  ),
                  disableSortBy: true,
                  accessor: 'amount',
                  width: 120,
                },
                {
                  Header: intl.formatMessage(
                    loanOverviewMessages.facilitiesListHeaderAmountCommitted,
                  ),
                  disableSortBy: true,
                  accessor: 'amountCommitted',
                  width: 100,
                },
                {
                  Header: intl.formatMessage(
                    loanOverviewMessages.facilitiesListHeaderAmountDrawn,
                  ),
                  disableSortBy: true,
                  accessor: 'amountDrawn',
                  width: 120,
                },
                {
                  Header: intl.formatMessage(
                    loanOverviewMessages.facilitiesListHeaderAmountUndrawn,
                  ),
                  disableSortBy: true,
                  accessor: 'amountUnDrawn',
                  width: 120,
                },
                {
                  Header: intl.formatMessage(
                    loanOverviewMessages.facilitiesListHeaderAmounRepaidLowerCase,
                  ),
                  disableSortBy: true,
                  accessor: 'amountRepaid',
                  width: 120,
                },
                {
                  Header: intl.formatMessage(
                    loanOverviewMessages.facilitiesListHeaderAmountOutstanding,
                  ),
                  disableSortBy: true,
                  accessor: 'amountOutstanding',
                  width: 120,
                },
                {
                  Header: intl.formatMessage(
                    loanOverviewMessages.facilitiesListHeaderStartDate,
                  ),
                  disableSortBy: true,
                  accessor: 'startDate',
                  width: 80,
                },
                assetType === AssetType.SYNDICATED_LOAN
                  ? {
                      Header: intl.formatMessage(
                        loanOverviewMessages.facilitiesListHeaderDuration,
                      ),
                      disableSortBy: true,
                      accessor: 'duration',
                      width: 90,
                    }
                  : {
                      Header: intl.formatMessage(
                        loanOverviewMessages.facilitiesListHeaderEndDate,
                      ),
                      disableSortBy: true,
                      accessor: 'endDate',
                      width: 8,
                    },
                {
                  Header: '',
                  reorderName: 'Actions',
                  accessor: 'actions',
                  disableResizing: true,
                  disableSortBy: true,
                  noPadding: true,
                  disableExport: true,
                  Cell: ({ row: { original } }: any) => {
                    if (hasRole(user, [UserType.INVESTOR])) {
                      if (
                        original.originalAmountDrawn <
                          original.facility.facilityAmount &&
                        actions.find((action) => action.state === 'paidSettled')
                      ) {
                        return (
                          <Button
                            key="drawdown"
                            size="small"
                            style={{ height: '32px' }}
                            label={intl.formatMessage(
                              loanOverviewMessages.drawdown,
                            )}
                            disabled={
                              !orderManagementRules(token).canCreateOrder
                            }
                            href={CLIENT_ROUTE_INVESTMENT_PRODUCT_DRAWDOWN.pathBuilder(
                              {
                                assetId: token.id,
                                facilityKey: original.facility.key,
                              },
                            )}
                          />
                        );
                      }
                    } else if (
                      hasRole(user, [UserType.UNDERWRITER]) &&
                      assetType === AssetType.SYNDICATED_LOAN &&
                      original.originalAmountDrawn >=
                        original.facility.facilityAmount
                    ) {
                      return (
                        <Button
                          key="novation"
                          size="small"
                          style={{ height: '32px' }}
                          label={intl.formatMessage(
                            loanOverviewMessages.novateFacility,
                          )}
                          disabled={!orderManagementRules(token).canCreateOrder}
                          href={CLIENT_ROUTE_INVESTMENT_PRODUCT_NOVATION.pathBuilder(
                            {
                              assetId: token.id,
                              facilityKey: original.facility.key,
                            },
                          )}
                        />
                      );
                    }
                    return <></>;
                  },
                },
              ]}
            />
            <br />
            <br />
          </>
        )}
        <TablePaginated
          tableSettingsId="loanOverviewTransactions"
          defaultColumnsHidden={[]}
          TableTitle={intl.formatMessage(
            loanOverviewMessages.recentTransactionsListTitle,
          )}
          translations={{
            emptyTitle: intl.formatMessage(
              loanOverviewMessages.recentTransactionsListEmpty,
            ),
            emptyDescription: intl.formatMessage(
              loanOverviewMessages.recentTransactionsListEmptyDesc,
            ),
          }}
          hidePagination
          data={transactionsData}
          columns={[
            {
              Header:
                hasRole(user, [UserType.ISSUER, UserType.UNDERWRITER]) &&
                assetType !== AssetType.SYNDICATED_LOAN
                  ? intl.formatMessage(
                      loanOverviewMessages.recentTransactionsListHeaderInvestor,
                    )
                  : intl.formatMessage(
                      loanOverviewMessages.recentTransactionsListHeaderEntity,
                    ),
              accessor: 'name',
              disableSortBy: true,
            },
            {
              Header: intl.formatMessage(
                loanOverviewMessages.recentTransactionsListHeaderRole,
              ),
              accessor: 'role',
              disableSortBy: true,
            },
            {
              Header: intl.formatMessage(
                loanOverviewMessages.recentTransactionsListHeaderType,
              ),
              accessor: 'type',
              disableSortBy: true,
            },
            {
              Header: intl.formatMessage(
                loanOverviewMessages.recentTransactionsListHeaderStatus,
              ),
              accessor: 'status',
              disableSortBy: true,
              Cell: ({ row: { original } }: any) => (
                <span
                  key={original.transaction.id}
                  style={{
                    padding: '2px 8px',
                    fontSize: 12,
                    borderRadius: 4,
                    ...getWorkflowInstanceStatusStyle(
                      original.transaction,
                      true,
                    ),
                  }}
                >
                  {getWorkflowInstanceStatus(
                    intl,
                    original.transaction,
                    true,
                    assetType,
                  )}
                </span>
              ),
              getCellExportValue: ({ original }: any) =>
                getWorkflowInstanceStatus(
                  intl,
                  original.transaction,
                  true,
                  assetType,
                ),
            },
            {
              Header: intl.formatMessage(
                loanOverviewMessages.recentTransactionsListHeaderAmount,
              ),
              accessor: 'amount',
              disableSortBy: true,
            },
            {
              Header: intl.formatMessage(
                loanOverviewMessages.recentTransactionsListHeaderDate,
              ),
              accessor: 'date',
              disableSortBy: true,
            },
            {
              Header: '',
              reorderName: intl.formatMessage(CommonTexts.actions),
              disableReorder: true,
              accessor: 'actions',
              disableResizing: true,
              disableSortBy: true,
              noPadding: true,
              disableExport: true,
              Cell: ({ row: { original } }: any) => (
                <HasRole
                  key={original.transaction.id}
                  user={user}
                  roles={[
                    UserType.ISSUER,
                    UserType.UNDERWRITER,
                    UserType.INVESTOR,
                  ]}
                >
                  <div className="hidden">
                    {original.transaction.type === WorkflowType.ORDER && (
                      <Link
                        to={CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID.pathBuilder({
                          orderId: `${original.transaction.id}`,
                        })}
                        style={{
                          color: colors.main,
                        }}
                      >
                        {intl.formatMessage(
                          loanOverviewMessages.recentTransactionsListViewOrder,
                        )}
                      </Link>
                    )}
                  </div>
                </HasRole>
              ),
            },
          ]}
        />
        <br />
        <br />
        <TablePaginated
          tableSettingsId="loanOverviewFacilityRecipients"
          defaultColumnsHidden={[]}
          TableTitle={intl.formatMessage(
            loanOverviewMessages.syndicateParticipantsListTitle,
          )}
          hidePagination
          data={facilityRecipientData}
          columns={[
            {
              Header: intl.formatMessage(
                loanOverviewMessages.syndicateParticipantsListHeaderEntity,
              ),
              accessor: 'name',
            },
            {
              Header: intl.formatMessage(
                loanOverviewMessages.syndicateParticipantsListHeaderRole,
              ),
              accessor: 'role',
            },
            {
              Header: intl.formatMessage(
                loanOverviewMessages.syndicateParticipantsListHeaderFacilityAllocation,
              ),
              accessor: 'allocation',
            },
            {
              Header: intl.formatMessage(
                loanOverviewMessages.syndicateParticipantsListHeaderFacilityPercentage,
              ),
              accessor: 'percentage',
            },
            {
              Header: '',
              accessor: 'actions',
              width: 100,
              Cell: ({ row: { original } }: any) => {
                if (hasRole(user, [UserType.INVESTOR])) {
                  if (['Lender', 'Lead Arranger'].includes(original.role)) {
                    return (
                      <Button
                        key="repayment"
                        size="small"
                        style={{ height: '32px' }}
                        label={intl.formatMessage(loanOverviewMessages.repay)}
                        href={CLIENT_ROUTE_INVESTMENT_PRODUCT_REPAYMENT.pathBuilder(
                          {
                            assetId: token.id,
                            facilityKey: original.facilityKey,
                            recipientId: original.userId,
                          },
                        )}
                      />
                    );
                  }
                  return null;
                }
                return null;
              },
            },
          ]}
        />
        <br />
        <br />

        {rightDocs.length + leftDocs.length > 0 && (
          <Card className="documents">
            <header>
              {intl.formatMessage(
                loanOverviewMessages.syndicateParticipantsListCellDocuments,
              )}
            </header>
            <div>
              <div>
                <ul>
                  {leftDocs.map((doc, docIndex) => {
                    if (!doc) {
                      return null;
                    }
                    return (
                      <li key={`doc-left-${docIndex}`}>
                        <span>{doc.name}</span>
                        <span>
                          <InputFile
                            value={[doc.name, doc.key]}
                            downloadable
                            preview={false}
                          />
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {docusignUrl && (
                  <Link
                    to={{ pathname: docusignUrl }}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 14 }}
                  >
                    {intl.formatMessage(assetIssuanceMessages.docSignURL)}
                  </Link>
                )}
              </div>

              {rightDocs.length > 0 && (
                <div>
                  <ul>
                    {rightDocs.map((doc, docIndex) => {
                      if (!doc) {
                        return null;
                      }
                      return (
                        <li key={`doc-left-${docIndex}`}>
                          <span>{doc.name}</span>
                          <span>
                            <InputFile
                              value={[doc.name, doc.key]}
                              downloadable
                              preview={false}
                            />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        <Card className="characteristics">
          <header>
            {intl.formatMessage(loanOverviewMessages.characteristicsTitle)}
          </header>

          <div>
            <div>
              <ul>
                <li>
                  <span>
                    {intl.formatMessage(
                      loanOverviewMessages.characteristicsSyndicationType,
                    )}
                  </span>
                  <span>
                    {capitalizeFirstLetter(loanSyndication as string)}
                  </span>
                </li>
                <li>
                  <span>
                    {intl.formatMessage(
                      loanOverviewMessages.characteristicsSecurityType,
                    )}
                  </span>
                  <span>{capitalizeFirstLetter(loanSecurity as string)}</span>
                </li>
                <li>
                  <span>
                    {intl.formatMessage(
                      loanOverviewMessages.characteristicsUtilisationTerms,
                    )}
                  </span>
                  <span>{capitalizeFirstLetter(loanTerms as string)}</span>
                </li>
              </ul>
            </div>

            <div>
              <ul>
                <li>
                  <span>
                    {intl.formatMessage(
                      loanOverviewMessages.characteristicsIdentifier,
                    )}
                  </span>
                  <span>
                    {security?.identifier ||
                    assetType === AssetType.SYNDICATED_LOAN
                      ? token.symbol
                      : '-'}
                  </span>
                </li>
                <li>
                  <span>
                    {intl.formatMessage(
                      loanOverviewMessages.characteristicsCurrency,
                    )}
                  </span>
                  <span>{getTokenCurrency(token)}</span>
                </li>
                <li>
                  <span>
                    {intl.formatMessage(
                      loanOverviewMessages.characteristicsFacilityLimit,
                    )}
                  </span>
                  <span>
                    {currencyFormat(
                      facilityLimit || 0,
                      getTokenCurrency(token),
                    )}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export const LoanOverview = injectIntl(LoanOverviewClass);
