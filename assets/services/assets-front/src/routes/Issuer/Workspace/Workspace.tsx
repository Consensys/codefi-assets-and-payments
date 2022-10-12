import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { mdiAlertOctagon, mdiCheckCircle } from '@mdi/js';
import { useHistory } from 'react-router-dom';
import { useAuth0 } from 'auth/auth0';
import { useIntl } from 'react-intl';

import { DataCall } from 'utils/dataLayer';
import { IUser } from 'User';
import Input from 'uiComponents/Input';
import Logo from 'uiComponents/Logo';
import Button from 'uiComponents/Button';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { colors } from 'constants/styles';
import { API_UPDATE_USER } from 'constants/apiRoutes';

import './WorkspaceStyles.scss';
import { workforceTexts } from 'texts/routes/issuer/workspace';
import { loginTexts } from 'texts/routes/login';
import { CommonTexts } from 'texts/commun/commonTexts';
import { setUser, userSelector } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

const Workspace = () => {
  const dispatch = useDispatch();
  const user = useSelector(userSelector) as IUser;
  const { logout } = useAuth0();
  const intl = useIntl();
  const { push } = useHistory();
  useEffect(() => {
    if (!!user.authId) {
      push('/');
    }
  }, [push, user]);
  return (
    <div id="_routes_workspace">
      <div className="logo-wrapper">
        <Logo withLabel />
      </div>
      <form
        onSubmit={async (e) => {
          try {
            e.preventDefault();
            const htmlElements: { [key: string]: HTMLInputElement } = e
              .currentTarget.elements as unknown as {
              [key: string]: HTMLInputElement;
            };
            const companyName = htmlElements.company.value;
            await DataCall({
              method: API_UPDATE_USER.method,
              path: API_UPDATE_USER.path(user.id),
              body: {
                updatedParameters: {
                  data: {
                    company: companyName,
                  },
                },
              },
            });

            dispatch(
              setUser({
                ...user,
                data: {
                  ...user.data,
                  company: companyName,
                },
              }),
            );
            EventEmitter.dispatch(
              Events.EVENT_APP_MESSAGE,
              appMessageData({
                message: intl.formatMessage(workforceTexts.companyNameChanged, {
                  companyName,
                }),
                icon: mdiCheckCircle,
                color: colors.success,
                isDark: true,
              }),
            );
            window.location.reload();
          } catch (error) {
            console.log(error);
            EventEmitter.dispatch(
              Events.EVENT_APP_MESSAGE,
              appMessageData({
                message: intl.formatMessage(workforceTexts.error),
                secondaryMessage: intl.formatMessage(workforceTexts.errorMsg),
                icon: mdiAlertOctagon,
                color: colors.error,
                isDark: true,
              }),
            );
          }
        }}
      >
        <h2>{intl.formatMessage(workforceTexts.enterCompanyName)}</h2>

        <span>{intl.formatMessage(workforceTexts.enterCompanyNameDesc)}</span>

        <Input
          name="company"
          label={intl.formatMessage(workforceTexts.companyName)}
          placeholder={intl.formatMessage(workforceTexts.companyName)}
          required
        />

        <Button
          type="submit"
          label={intl.formatMessage(CommonTexts.continue)}
          size="small"
        />
        <Button
          onClick={() => logout({ returnTo: window.location.origin })}
          size="small"
          type="button"
          color={colors.main}
          secondary
          label={intl.formatMessage(loginTexts.logout)}
        />
      </form>
    </div>
  );
};

export default Workspace;
