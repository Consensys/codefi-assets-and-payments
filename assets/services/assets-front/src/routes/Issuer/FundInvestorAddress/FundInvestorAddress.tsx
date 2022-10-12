import React, { useEffect } from 'react';
import { RouteComponentProps } from 'react-router-dom';

import PageTitle from 'uiComponents/PageTitle';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';

import { Card } from 'uiComponents/Card';

import { DataCall } from 'utils/dataLayer';
import { getClientName } from 'utils/commonUtils';
import { API_FETCH_USER_BY_ROLE } from 'constants/apiRoutes';
import { IUser } from 'User';

import './FundInvestorAddress.scss';
import { buildTabs } from '../FundInvestorAssets/utils/buildAssetData';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { fundInvestorAddressMessages } from 'texts/routes/issuer/assetManagement';
import Address from 'uiComponents/Address';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { userSelector } from 'features/user/user.store';
import { useCallback } from 'react';

interface IProps
  extends WrappedComponentProps,
    RouteComponentProps<{
      issuerId: string;
      investorId: string;
    }> {}

interface IState {
  isLoading: boolean;
  hasLoadingError: boolean;
  investor?: IUser;
}

const FundInvestorAddressComponent: React.FC<IProps> = ({ intl, match }) => {
  const user = useSelector(userSelector) as IUser;
  const [state, setState] = useState<IState>({
    isLoading: true,
    hasLoadingError: false,
  });

  const loadData = useCallback(async () => {
    try {
      setState((s) => ({
        ...s,
        isLoading: true,
      }));

      const { user: investor }: { user: IUser } = await DataCall({
        method: API_FETCH_USER_BY_ROLE.method,
        path: API_FETCH_USER_BY_ROLE.path(match.params.investorId),
      });

      setState((s) => ({
        ...s,
        investor,
        isLoading: false,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        isLoading: false,
        hasLoadingError: true,
      }));
    }
  }, [match.params.investorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (state.isLoading) {
    return (
      <div className="_route_issuer_fundInvestorAddress">
        <PageLoader />
      </div>
    );
  }

  if (state.hasLoadingError || !state.investor) {
    return (
      <div className="_route_issuer_fundInvestorAddress">
        <PageError />
      </div>
    );
  }

  const role = user.userType;

  return (
    <div className="_route_issuer_fundInvestorAddress">
      <PageTitle
        title={getClientName(state.investor)}
        tabNavigation={buildTabs({
          active: 'address',
          investorId: state.investor.id,
          role,
        })}
      />

      <main>
        <div className="informations">
          <Card className="kyc">
            <header>
              {intl.formatMessage(fundInvestorAddressMessages.ethereumAddress)}
            </header>

            <ul>
              <li>
                <Address address={state.investor.defaultWallet as string} />
              </li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
};

export const FundInvestorAddress = injectIntl(FundInvestorAddressComponent);
