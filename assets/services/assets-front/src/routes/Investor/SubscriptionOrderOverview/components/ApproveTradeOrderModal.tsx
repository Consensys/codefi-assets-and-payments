import isEmpty from 'lodash/isEmpty';
import {
  API_APPROVE_SECONDARY_TRADE_ORDER,
  API_FETCH_LINKS,
  API_CREATE_CLIENT,
  API_INVITE_CLIENT_FOR_KYC,
} from 'constants/apiRoutes';
import { colors } from 'constants/styles';
import React from 'react';
import {
  IToken,
  IWorkflowInstance,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import { CLIENT_ROUTE_INVESTOR_PROFILE } from 'routesList';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import Button from 'uiComponents/Button';
import PageLoader from 'uiComponents/PageLoader';
import { EntityType, IUser, UserType } from 'User';

import { DataCall } from 'utils/dataLayer';

import { mdiAlert, mdiAlertOctagon } from '@mdi/js';

import Icon from 'uiComponents/Icon';
import { useIntl } from 'react-intl';
import { CommonTexts } from 'texts/commun/commonTexts';
import { SubscriptionTexts } from 'texts/routes/investor/Subscription';
import { EventEmitter, Events } from 'features/events/EventEmitter';
import { Link } from 'react-router-dom';

const isStateValidated = (link?: IWorkflowInstance) =>
  link?.state === 'validated';

interface Props {
  order: IWorkflowInstance;
  token: IToken;
  user: IUser;
  callback: () => void;
}

const ApproveTradeOrderModal = ({ order, token, user, callback }: Props) => {
  const dvpRecipient = order.data?.dvp?.recipient;
  const dvpRecipientEmail = dvpRecipient?.email;
  const dvpRecipientId = dvpRecipient?.id;
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [issuerLink, setIssuerLink] = React.useState<IWorkflowInstance>();
  const [tokenLink, setTokenLink] = React.useState<IWorkflowInstance>();
  const intl = useIntl();

  const fetchLinks = React.useCallback(
    async (dvpRecipientId) => {
      try {
        setLoading(true);
        const { links: issuerLinks } = await DataCall({
          method: API_FETCH_LINKS.method,
          path: API_FETCH_LINKS.path(dvpRecipientId),
          urlParams: {
            entityId: user.id,
            entityType: EntityType.ISSUER,
          },
        });
        setIssuerLink(issuerLinks?.[0]);
        const { links: tokenLinks } = await DataCall({
          method: API_FETCH_LINKS.method,
          path: API_FETCH_LINKS.path(dvpRecipientId),
          urlParams: {
            entityId: order.entityId,
            entityType: EntityType.TOKEN,
            assetClass: order.assetClassKey,
          },
        });
        setTokenLink(tokenLinks?.[0]);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    },
    [order.assetClassKey, order.entityId, user.id],
  );

  React.useEffect(() => {
    if (dvpRecipientId) {
      fetchLinks(dvpRecipientId);
    }
  }, [dvpRecipientId, fetchLinks]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const isInvestorNotAllowListed =
        !issuerLink || !isStateValidated(issuerLink);

      if (isInvestorNotAllowListed) {
        const { user: newUser } = await DataCall({
          method: API_CREATE_CLIENT.method,
          path: API_CREATE_CLIENT.path(),
          body: {
            email: dvpRecipientEmail,
            firstName: '',
            lastName: '',
            userType: UserType.INVESTOR,
          },
        });

        const userId = newUser.id;

        await DataCall({
          method: API_INVITE_CLIENT_FOR_KYC.method,
          path: API_INVITE_CLIENT_FOR_KYC.path(user.userType),
          body: {
            submitterId: userId,
          },
        });
      }

      await DataCall({
        method: API_APPROVE_SECONDARY_TRADE_ORDER.method,
        path: API_APPROVE_SECONDARY_TRADE_ORDER.path(),
        body: {
          orderId: order.id,
          sendNotification: true,
          sendInviteNotification: isInvestorNotAllowListed,
        },
      });
      callback();
      setSubmitting(false);
      EventEmitter.dispatch(Events.EVENT_CLOSE_MODAL);
    } catch (error) {
      setSubmitting(false);
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(CommonTexts.error),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <>
      {!isEmpty(tokenLink) && isStateValidated(issuerLink) && (
        <div style={{ width: 520, padding: 32 }}>
          <p>
            {intl.formatMessage(
              SubscriptionTexts.areYouSureYouWantToApproveOrder,
            )}
          </p>
        </div>
      )}

      {isStateValidated(issuerLink) && isEmpty(tokenLink) && (
        <>
          <div
            style={{
              background: '#FFF8ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 12,
            }}
          >
            <Icon color="#D9992B" icon={mdiAlert} />{' '}
            <span style={{ fontSize: 14 }}>
              {intl.formatMessage(
                SubscriptionTexts.actionWillGrantBuyerAccessTo,
                { token: token.name },
              )}
            </span>
          </div>
          <div
            style={{
              width: 520,
              padding: 32,
              borderBottom: '1px solid #dfe0e5',
            }}
          >
            <p>
              {intl.formatMessage(SubscriptionTexts.doYouApproveOrder, {
                token: token.name,
              })}
            </p>
            <p>
              <Link
                to={CLIENT_ROUTE_INVESTOR_PROFILE.pathBuilder({
                  investorId: order.data?.dvp?.recipient?.id as string,
                })}
                target="_blank"
                rel="noopener noreferrer"
              >
                {intl.formatMessage(SubscriptionTexts.viewBuyerInformation)}
              </Link>
            </p>
            <p>{intl.formatMessage(SubscriptionTexts.byApproving)}</p>
          </div>
        </>
      )}

      {!isStateValidated(issuerLink) && isEmpty(tokenLink) && (
        <>
          <div
            style={{
              background: '#FFF8ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 12,
            }}
          >
            <Icon color="#D9992B" icon={mdiAlert} />{' '}
            <span style={{ fontSize: 14 }}>
              {intl.formatMessage(SubscriptionTexts.inviteBuyerToPlatform)}
            </span>
          </div>
          <div
            style={{
              width: 520,
              padding: 32,
              borderBottom: '1px solid #dfe0e5',
            }}
          >
            <p>{intl.formatMessage(SubscriptionTexts.doYOuApproveOrderKYC)}</p>

            <p>{intl.formatMessage(SubscriptionTexts.buyerMustCompleteKYC)}</p>
          </div>
        </>
      )}

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
          label="Approve order"
          size="small"
          isLoading={submitting}
          onClick={handleSubmit}
        />
      </footer>
    </>
  );
};

export default ApproveTradeOrderModal;
