import React, { useState, useEffect, FormEvent } from 'react';
import {
  API_FETCH_USERS,
  API_ALLOWLIST_TOKEN_RELATED_KYC,
} from 'constants/apiRoutes';
import { DataCall } from 'utils/dataLayer';
import { IUser, LinkStatus } from 'User';
import { IToken } from 'routes/Issuer/AssetIssuance/templatesTypes';
import PageLoader from 'uiComponents/PageLoader';
import { CLIENT_ROUTE_CLIENT_MANAGEMENT } from 'routesList';
import InputGroup from 'uiComponents/InputGroup';
import Radio from 'uiComponents/Radio';
import Button from 'uiComponents/Button';
import Checkbox from 'uiComponents/Checkbox';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { mdiAlertOctagon } from '@mdi/js';
import { colors } from 'constants/styles';
import { getProductFromToken, getClientName } from 'utils/commonUtils';
import { useIntl } from 'react-intl';
import { fundInvestorsDialogs } from 'texts/routes/issuer/fundInvestor';
import { ClassData } from 'routes/Issuer/AssetIssuance/assetTypes';
import { EventEmitter, Events } from 'features/events/EventEmitter';
import { Link } from 'react-router-dom';

interface IProps {
  token: IToken;
  investors: Array<IUser>;
  callback: () => void;
}

const AddInvestorsDialog = ({
  token,
  investors: tokenInvestors,
  callback,
}: IProps) => {
  const { shareClasses } = getProductFromToken(token);

  const [loading, setLoading] = useState(true);
  const [investors, setInvestors] = useState<Array<IUser>>([]);
  const [selectedInvestors, setSelectedInvestors] = useState<Array<IUser>>([]);
  const [selectedShareClass, setSelectedShareClass] = useState<ClassData>();
  const intl = useIntl();
  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        setLoading(true);

        const { users }: { users: Array<IUser> } = await DataCall({
          method: API_FETCH_USERS.method,
          path: API_FETCH_USERS.path(),
          urlParams: {
            offset: 0,
            limit: 50,
          },
        });

        const investors = users.filter(
          (user) =>
            (user.link || {}).state === LinkStatus.VALIDATED &&
            tokenInvestors
              .map((tokenInvestor) => tokenInvestor.id)
              .indexOf(user.id) === -1,
        );

        setInvestors(investors);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
        if (shareClasses.length === 1) {
          setSelectedShareClass(shareClasses[0]);
        }
      }
    };
    fetchInvestors();
  }, [token, shareClasses, tokenInvestors]);

  if (loading && !selectedShareClass && selectedInvestors.length === 0) {
    return <PageLoader />;
  }

  if (investors.length === 0) {
    return (
      <>
        <div
          style={{
            borderBottom: '1px solid #dfe0e5',
            padding: '16px 32px',
          }}
        >
          <h2
            style={{
              fontWeight: 600,
              fontSize: '16px',
              marginBottom: 10,
            }}
          >
            {intl.formatMessage(fundInvestorsDialogs.addInvestorsNoInvestors)}
          </h2>
          <span style={{ fontSize: '16px' }}>
            {intl.formatMessage(
              fundInvestorsDialogs.addInvestorsNoInvestorsDescPreLink,
            )}
            <Link
              to={CLIENT_ROUTE_CLIENT_MANAGEMENT}
              target="_blank"
              rel="noopener noreferrer"
            >
              {intl.formatMessage(fundInvestorsDialogs.clientManagement)}
            </Link>{' '}
            {intl.formatMessage(
              fundInvestorsDialogs.addInvestorsNoInvestorsDescPostLink,
            )}
          </span>
        </div>
        <footer
          style={{
            padding: '16px 32px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            style={{ marginLeft: '16px' }}
            label={intl.formatMessage(fundInvestorsDialogs.cancel)}
            size="small"
            onClick={() => {
              EventEmitter.dispatch(Events.EVENT_CLOSE_MODAL);
            }}
          />
        </footer>
      </>
    );
  }

  if (!selectedShareClass) {
    return (
      <>
        <div
          style={{
            borderBottom: '1px solid #dfe0e5',
            padding: '16px 32px',
            width: 400,
          }}
        >
          <h2 style={{ fontSize: 14 }}>
            {intl.formatMessage(fundInvestorsDialogs.addShareClass)}
          </h2>

          <InputGroup style={{ paddingLeft: '10px' }}>
            {shareClasses.map((shareClass) => {
              return (
                <Radio
                  key={shareClass.key}
                  label={shareClass.name || shareClass.key}
                  onChange={() => {
                    setSelectedShareClass(shareClass);
                  }}
                />
              );
            })}
          </InputGroup>
        </div>
        <footer
          style={{
            padding: '16px 32px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            style={{ marginLeft: '16px' }}
            label={intl.formatMessage(fundInvestorsDialogs.cancel)}
            size="small"
            onClick={() => {
              EventEmitter.dispatch(Events.EVENT_CLOSE_MODAL);
            }}
          />
        </footer>
      </>
    );
  }

  return (
    <form
      style={{ width: 400 }}
      onSubmit={async (event: FormEvent<HTMLFormElement>) => {
        try {
          event.preventDefault();
          setLoading(true);
          for (const investor of selectedInvestors) {
            await DataCall({
              method: API_ALLOWLIST_TOKEN_RELATED_KYC.method,
              path: API_ALLOWLIST_TOKEN_RELATED_KYC.path(),
              body: {
                submitterId: investor.id,
                tokenId: token.id,
                assetClass: selectedShareClass.key,
                sendNotification: true,
              },
            });
          }
          EventEmitter.dispatch(Events.EVENT_CLOSE_MODAL);
          callback();
        } catch (error) {
          setLoading(false);
          EventEmitter.dispatch(
            Events.EVENT_APP_MESSAGE,
            appMessageData({
              message: intl.formatMessage(
                fundInvestorsDialogs.addInvestorsError,
              ),
              secondaryMessage: String(error),
              icon: mdiAlertOctagon,
              color: colors.error,
              isDark: true,
            }),
          );
        }
      }}
    >
      <div style={{ maxHeight: 600, overflow: 'auto' }}>
        <div
          style={{ borderBottom: '1px solid #dfe0e5', padding: '16px 32px' }}
        >
          <h2 style={{ fontSize: 14 }}>
            {intl.formatMessage(fundInvestorsDialogs.asset)}
          </h2>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {token.name}
            {selectedShareClass.isin && (
              <span style={{ fontWeight: 400, marginLeft: 5 }}>
                ({selectedShareClass.isin})
              </span>
            )}
          </h2>

          <span>
            {intl.formatMessage(fundInvestorsDialogs.selectInvestorsToAdd)}
          </span>
          <InputGroup style={{ paddingLeft: '10px' }}>
            {investors.map((investor) => {
              return (
                <Checkbox
                  key={investor.id}
                  label={getClientName(investor)}
                  required={selectedInvestors.length === 0}
                  onChange={(e: FormEvent<HTMLInputElement>) => {
                    if ((e.target as HTMLInputElement).checked) {
                      setSelectedInvestors([...selectedInvestors, investor]);
                    } else {
                      setSelectedInvestors(
                        [...selectedInvestors].filter(
                          (i) => i.id !== investor.id,
                        ),
                      );
                    }
                  }}
                />
              );
            })}
          </InputGroup>
        </div>
      </div>
      <footer
        style={{
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Button
          style={{ marginLeft: '16px' }}
          type="submit"
          label={intl.formatMessage(fundInvestorsDialogs.add)}
          isLoading={loading}
          size="small"
        />
      </footer>
    </form>
  );
};

export default AddInvestorsDialog;
