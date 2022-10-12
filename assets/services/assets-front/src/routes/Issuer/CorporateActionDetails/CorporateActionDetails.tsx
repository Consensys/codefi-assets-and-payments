import React, { useCallback, useEffect, useState } from 'react';

import PageTitle from 'uiComponents/PageTitle';
import './CorporateActionDetailsStyles.scss';
import { useIntl } from 'react-intl';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError/PageError';
import { DataCall } from 'utils/dataLayer';
import {
  API_ASSET_INVESTORS_ALL_GET,
  API_CANCEL_EVENT,
  API_FORCE_BURN,
  API_RETRIEVE_ASSET_BY_ID,
  API_RETRIEVE_EVENT,
  API_SETTLE_EVENT,
} from 'constants/apiRoutes';
import {
  IToken,
  IWorkflowInstance,
  TokenState,
} from '../AssetIssuance/templatesTypes';
import { useParams } from 'react-router-dom';
import { corporateActionsTexts } from 'texts/routes/issuer/corporateActions';
import { useDispatch } from 'react-redux';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { colors } from 'constants/styles';
import {
  capitalizeFirstLetter,
  getEventCurrency,
  getProductFromToken,
  getTokenShareClassCurrentNav,
} from 'utils/commonUtils';
import { Table, tableFilterOptions } from 'uiComponents/Table';
import moment from 'moment';
import Button from 'uiComponents/Button';
import { currencyFormat } from 'utils/currencyFormat';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { mdiAlertOctagon } from '@mdi/js';
import { IUser, UserType } from 'User';
import { EventState } from 'utils/eventStateUtils';
import { setAppModal } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

const CorporateActionDetails: React.FC = () => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const [balanceMap, setBalanceMap] = useState(new Map());
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadingError, setHasLoadingError] = useState(false);
  const [event, setEvent] = useState<IWorkflowInstance>();
  const [eventInvestors, setEventInvestors] = useState([]);
  const [investorsWithPositiveBalances, setInvestorsWithPositiveBalances] =
    useState<IUser[]>([]);
  const [token, setToken] = useState<IToken>();
  const allStatusFilterOptions = [
    {
      title: intl.formatMessage(corporateActionsTexts.scheduled),
      value: EventState.SCHEDULED,
    },
    {
      title: intl.formatMessage(corporateActionsTexts.settled),
      value: EventState.SETTLED,
    },
    {
      title: intl.formatMessage(corporateActionsTexts.canceled),
      value: EventState.CANCELLED,
    },
  ];

  const loadData = useCallback(
    async (hideLoading?: boolean) => {
      try {
        if (!hideLoading) {
          setIsLoading(true);
        }

        const { event }: { event: IWorkflowInstance } = await DataCall({
          method: API_RETRIEVE_EVENT.method,
          path: API_RETRIEVE_EVENT.path((params as any).eventId),
        });

        //Calling this method to get all investors then filter ans set investors with positive balances.
        const { users }: { users: IUser[] } = await DataCall({
          method: API_ASSET_INVESTORS_ALL_GET.method,
          path: API_ASSET_INVESTORS_ALL_GET.path((params as any).assetId),
          urlParams: {
            withBalances: true,
          },
        });
        const investorsWithPositiveBalances: IUser[] = users.filter(
          (singleUser) => {
            return (
              singleUser.userType === UserType.INVESTOR &&
              singleUser.tokenRelatedData?.balances?.total !== undefined &&
              singleUser.tokenRelatedData?.balances?.total > 0
            );
          },
        );
        setInvestorsWithPositiveBalances(investorsWithPositiveBalances);

        const eventInvestorsWithPositiveBalances =
          event.data.eventInvestors.filter((singleInvestor: any) => {
            return investorsWithPositiveBalances.find(
              (element) => element.id === singleInvestor.id,
            );
          });
        const { token }: { token: IToken } = await DataCall({
          method: API_RETRIEVE_ASSET_BY_ID.method,
          path: API_RETRIEVE_ASSET_BY_ID.path((params as any).assetId),
          urlParams: {
            withBalances: false,
            withCycles: true,
          },
        });
        setToken(token);
        setEventInvestors(eventInvestorsWithPositiveBalances);
        setEvent(event);

        //Fill balanceMap
        investorsWithPositiveBalances.forEach((investor: IUser) => {
          const tokenBalance = investor.tokenRelatedData?.balances?.total;
          balanceMap.set(
            investor.id,
            tokenBalance
              ? tokenBalance * getTokenShareClassCurrentNav(token)
              : (event.data.amount || 0) /
                  (event.data.eventInvestors.length === 0
                    ? 1
                    : event.data.eventInvestors.length),
          );
        });
        setBalanceMap(balanceMap);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        setHasLoadingError(true);
      }
    },
    [params, balanceMap],
  );

  const getTotalCouponsAmount = (selectedIds: any) => {
    let sum = 0;
    selectedIds.forEach((id: any) => (sum += balanceMap.get(id)));
    return sum;
  };

  /**
   * This fct takes as arg a list of selected investor ids and it will burn the tokens
   * invested by those investors.
   * @param investorIds list of selected investor Ids
   */
  const forceBurnTokens = async (investorIds: any[]) => {
    const intersection = investorsWithPositiveBalances.filter((element) =>
      investorIds.includes(element.id),
    );

    if (token) {
      const { shareClasses } = getProductFromToken(token);
      await Promise.all(
        intersection.map(async (singleInvestor) => {
          const investorId = singleInvestor.id;
          const quantity = singleInvestor.tokenRelatedData?.balances?.total;

          try {
            await DataCall({
              method: API_FORCE_BURN.method,
              path: API_FORCE_BURN.path((params as any).assetId),
              body: {
                investorId: investorId,
                quantity: quantity,
                class: shareClasses[0].key,
                state: TokenState.ISSUED,
                sendNotification: true,
              },
            });
          } catch (error) {
            throw error;
          }
        }),
      );
    } else {
      throw new Error('Error burning tokens');
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading && !event) {
    return <PageLoader />;
  }

  if (hasLoadingError || !event) {
    return <PageError />;
  }

  return (
    <div id="_routes_issuer_corporateActionDetails">
      <PageTitle
        title={capitalizeFirstLetter(event.data.eventType || '')}
        withBreadcrumbs
      />
      <main>
        <div className="keyInfoCutOff">
          <div className="keyInfo">
            <div className="infoBox">
              <div className="infoTitle">
                {intl.formatMessage(corporateActionsTexts.type)}
              </div>
              <div className="infoValue">
                {capitalizeFirstLetter(event.data.eventType || '')}
              </div>
            </div>
            <div className="infoBox">
              <div className="infoTitle">
                {intl.formatMessage(corporateActionsTexts.settlement)}
              </div>
              <div className="infoValue">
                {moment(event.data.settlementDate).format('YYYY-MM-DD hh:mm')}{' '}
                {
                  new Date(event.data.settlementDate || '')
                    .toLocaleTimeString('en-us', { timeZoneName: 'short' })
                    .split(' ')[2]
                }
              </div>
            </div>
            <div className="infoBox">
              <div className="infoTitle">
                {intl.formatMessage(corporateActionsTexts.investors)}
              </div>
              <div className="infoValue">
                {investorsWithPositiveBalances.length}
              </div>
            </div>
            <div className="infoBox">
              <div className="infoTitle">
                {intl.formatMessage(corporateActionsTexts.totalAmount)}
              </div>
              <div className="infoValue">
                {currencyFormat(
                  event.data.amount || 0,
                  getEventCurrency(event),
                )}
              </div>
            </div>
          </div>
        </div>
        <Table
          tableSettingsId="fundCorporateActionsDetails"
          isLoading={isLoading}
          defaultColumnsHidden={[]}
          data={eventInvestors}
          selectable
          SelectedItemsActions={({ selectedItems }) => {
            const scheduled = selectedItems.filter(
              (el) => el.eventState === EventState.SCHEDULED,
            );
            const toSettle = selectedItems.filter(
              (el) => el.eventState === EventState.SCHEDULED,
            );
            const toSettleInvestors = toSettle.map(
              (selectedItem) => selectedItem.id,
            );

            const investorsId = selectedItems.map(
              (selectedItem) => selectedItem.id,
            );
            return (
              <>
                {scheduled.length > 0 ? (
                  <>
                    <Button
                      className="eventSettleButton"
                      label={intl.formatMessage(
                        corporateActionsTexts.settleEvent,
                      )}
                      type="submit"
                      onClick={async () => {
                        dispatch(
                          setAppModal(
                            appModalData({
                              title: intl.formatMessage(
                                corporateActionsTexts.settleEvent,
                              ),
                              confirmAction: async () => {
                                try {
                                  setIsLoading(true);
                                  await DataCall({
                                    method: API_SETTLE_EVENT.method,
                                    path: API_SETTLE_EVENT.path(),
                                    body: {
                                      investorsId: toSettleInvestors,
                                      eventId: (params as any).eventId,
                                    },
                                  });
                                  await loadData();
                                  await forceBurnTokens(investorsId);
                                  setIsLoading(false);
                                } catch (error) {
                                  setIsLoading(false);
                                  setHasLoadingError(true);
                                  EventEmitter.dispatch(
                                    Events.EVENT_APP_MESSAGE,
                                    appMessageData({
                                      message: intl.formatMessage(
                                        corporateActionsTexts.settleEventError,
                                      ),
                                      secondaryMessage: String(error),
                                      icon: mdiAlertOctagon,
                                      color: colors.error,
                                      isDark: true,
                                    }),
                                  );
                                }
                              },
                              confirmLabel: intl.formatMessage(
                                corporateActionsTexts.settleEvent,
                              ),
                              confirmColor: colors.main,
                              content: (
                                <>
                                  <div>
                                    {intl.formatMessage(
                                      corporateActionsTexts.settleConfirmation,
                                      {
                                        numberOfCoupons: toSettle.length,
                                        totalAmount: currencyFormat(
                                          getTotalCouponsAmount(investorsId) ||
                                            0,
                                        ),
                                      },
                                    )}
                                  </div>
                                </>
                              ),
                            }),
                          ),
                        );
                      }}
                    />
                    <Button
                      className="eventCancelButton"
                      label={intl.formatMessage(
                        corporateActionsTexts.cancelEvent,
                      )}
                      secondary
                      color="#B20000"
                      textColor="#B20000"
                      onClick={async () => {
                        dispatch(
                          setAppModal(
                            appModalData({
                              title: intl.formatMessage(
                                corporateActionsTexts.cancelEvent,
                              ),
                              confirmAction: async () => {
                                try {
                                  setIsLoading(true);
                                  await DataCall({
                                    method: API_CANCEL_EVENT.method,
                                    path: API_CANCEL_EVENT.path(),
                                    body: {
                                      investorsId,
                                      eventId: (params as any).eventId,
                                    },
                                  });
                                  await loadData();
                                  setIsLoading(false);
                                } catch (error) {
                                  setIsLoading(false);
                                  setHasLoadingError(true);
                                  EventEmitter.dispatch(
                                    Events.EVENT_APP_MESSAGE,
                                    appMessageData({
                                      message: intl.formatMessage(
                                        corporateActionsTexts.cancelEventError,
                                      ),
                                      secondaryMessage: String(error),
                                      icon: mdiAlertOctagon,
                                      color: colors.error,
                                      isDark: true,
                                    }),
                                  );
                                }
                              },
                              confirmLabel: intl.formatMessage(
                                corporateActionsTexts.cancelEvent,
                              ),
                              confirmColor: colors.errorDark,
                              content: (
                                <>
                                  <div>
                                    {intl.formatMessage(
                                      corporateActionsTexts.cancelConfirmation,
                                    )}
                                  </div>
                                </>
                              ),
                            }),
                          ),
                        );
                      }}
                    />
                  </>
                ) : (
                  <div>
                    {intl.formatMessage(corporateActionsTexts.eventStateInfo)}
                  </div>
                )}
              </>
            );
          }}
          translations={{
            emptyTitle: intl.formatMessage(
              corporateActionsTexts.emptyEventsTitle,
            ),
            emptyDescription: intl.formatMessage(
              corporateActionsTexts.emptyEventsMessage,
            ),
          }}
          columns={[
            {
              Header: intl.formatMessage(corporateActionsTexts.status),
              accessor: 'eventState',
              filter: tableFilterOptions,
              filterValues: allStatusFilterOptions,
              Cell: function statusItems({
                row: { original },
              }: {
                row: { original: any };
              }) {
                return (
                  <span
                    className={
                      original.eventState === EventState.SCHEDULED
                        ? 'scheduledClass'
                        : original.eventState === EventState.SETTLED
                        ? 'settledClass'
                        : 'cancelledClass'
                    }
                  >
                    {original.eventState.toUpperCase()}
                  </span>
                );
              },
              noPadding: true,
              width: 100,
            },
            {
              Header: intl.formatMessage(corporateActionsTexts.type),
              accessor: 'type',
              width: 100,
              disableSortBy: true,
              Cell: ({ row: { original } }: any) =>
                capitalizeFirstLetter(event.data.eventType || ''),
              getCellExportValue: (row: any) =>
                capitalizeFirstLetter(event.data.eventType || ''),
            },
            {
              Header: intl.formatMessage(corporateActionsTexts.investor),
              accessor: 'investor',
              disableSortBy: true,
              Cell: ({ row: { original } }: { row: { original: any } }) =>
                original.investorName,
              width: 100,
            },
            {
              Header: intl.formatMessage(corporateActionsTexts.amount),
              accessor: 'amount',
              disableSortBy: true,
              width: 100,
              Cell: ({ row: { original } }: { row: { original: any } }) => {
                return currencyFormat(
                  balanceMap.get(original.id),
                  getEventCurrency(event),
                );
              },
            },
            {
              Header: intl.formatMessage(corporateActionsTexts.id),
              accessor: 'id',
              disableSortBy: true,
              Cell: ({ row: { original } }: { row: { original: any } }) =>
                event.id,
              width: 100,
            },
            {
              Header: intl.formatMessage(corporateActionsTexts.date),
              accessor: 'date',
              Cell: ({ row: { original } }: { row: { original: any } }) =>
                moment(event.data.settlementDate).format('YYYY-MM-DD'),
              disableSortBy: true,
              width: 100,
            },
          ]}
        />
      </main>
    </div>
  );
};

export default CorporateActionDetails;
