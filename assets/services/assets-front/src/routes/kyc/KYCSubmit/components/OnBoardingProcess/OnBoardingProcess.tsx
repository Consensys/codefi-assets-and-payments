import React, { useState } from 'react';
import { Route, RouteComponentProps, Switch, Redirect } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { mdiArrowLeft, mdiCheckCircle, mdiAlertOctagon } from '@mdi/js';

import { DataCall } from 'utils/dataLayer';
import { commonActionsTexts } from 'texts/commun/actions';

import {
  API_SAVE_KYC_ELEMENT_INSTANCE,
  API_SUBMIT_ISSUER_RELATED_KYC,
  API_UPDATE_USER,
} from 'constants/apiRoutes';

import {
  CLIENT_ROUTE_SUBMIT_KYC_STEP_BY_ROLE,
  CLIENT_ROUTE_SUBMIT_KYC_BY_ROLE,
} from 'routesList';

import Button from 'uiComponents/Button';
import ProgressMenu from 'uiComponents/ProgressMenu';

import { IKYCSection } from 'types/KYCSection';
import { IProgress } from 'types/Progress';

import KYCSection from './components/KYCSection';
import KycSubmission from './components/KycSubmission';

import './OnBoardingProcessStyles.scss';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { colors } from 'constants/styles';
import { IUser, UserNature } from 'User';
import { IKYCTemplate } from 'types/KYCTemplate';
import { IKYCElementInstance } from 'types/KYCElementInstance';
import { computeKycProgress } from 'utils/commonUtils';
import { useIntl } from 'react-intl';
import { CommonTexts } from 'texts/commun/commonTexts';
import { setUser, userSelector } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

export const KYC_SUBMIT_ROUTE = 'submit';

interface IProps
  extends RouteComponentProps<{
    step: string;
    issuerId: string;
  }> {
  sections: Array<IKYCSection>;
  template: IKYCTemplate;
  fetchLink: () => Promise<void>;
}

const OnBoardingProcess: React.FC<IProps> = ({
  match: {
    params: { step, issuerId },
  },
  history: { push },
  sections,
  template,
  fetchLink,
}: IProps) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const user = useSelector(userSelector) as IUser;
  const kycCompletion: Array<IProgress> = computeKycProgress(sections);
  const atLeastOneRejected = kycCompletion.some((item) => item.rejected);
  const [saving, setSaving] = useState(false);

  const currentStepIndex = sections.findIndex(({ key }) => key === step);

  const saveElement = async (name: string, value: Array<string>) => {
    try {
      setSaving(true);
      if (name.startsWith('investorType_')) {
        const matchingElement = sections[currentStepIndex].elements.find(
          (e) => e.name === name,
        );
        if (matchingElement) {
          await DataCall({
            method: API_UPDATE_USER.method,
            path: API_UPDATE_USER.path(user.id),
            body: {
              updatedParameters: {
                userNature:
                  matchingElement.element.inputs[parseInt(value[0])].value,
              },
            },
          });

          dispatch(
            setUser({
              ...user,
              userNature: matchingElement.element.inputs[parseInt(value[0])]
                .value as UserNature,
            }),
          );

          await fetchLink();
        }
      }
      const {
        elementInstances,
      }: {
        elementInstances: Array<{
          elementInstance: IKYCElementInstance;
          newElementInstance: boolean;
        }>;
      } = await DataCall({
        method: API_SAVE_KYC_ELEMENT_INSTANCE.method,
        path: API_SAVE_KYC_ELEMENT_INSTANCE.path(),
        body: {
          elements: [
            {
              elementKey: name,
              value,
            },
          ],
        },
      });

      sectionsLoop: for (const section of sections) {
        for (const element of section.elements) {
          if (element.name === name) {
            element.elementInstance = elementInstances[0].elementInstance;
            break sectionsLoop;
          }
        }
      }
    } catch (error) {
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
    } finally {
      setSaving(false);
    }
  };

  const submitKyc = async () => {
    try {
      setSaving(true);
      const elements = sections.reduce(
        (
          map: Array<{
            elementKey: string;
            value: Array<string>;
          }>,
          currentSection: IKYCSection,
        ) => [
          ...map,
          ...currentSection.elements
            .map((item) => item.elementInstance)
            .filter((element) => !!element)
            .map((element) => ({
              value: element.value,
              elementKey: element.elementKey,
            })),
        ],
        [],
      );

      await DataCall({
        method: API_SUBMIT_ISSUER_RELATED_KYC.method,
        path: API_SUBMIT_ISSUER_RELATED_KYC.path(),
        body: {
          issuerId,
          elements,
          sendNotification: true,
        },
      });

      await fetchLink();

      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: 'KYC SUBMITTED SUCCESSFULLY',
          icon: mdiCheckCircle,
          color: colors.success,
          isDark: true,
        }),
      );
      push(
        CLIENT_ROUTE_SUBMIT_KYC_BY_ROLE.pathBuilder({
          issuerId,
        }),
      );
    } catch (error) {
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: 'KYC SUBMISSION ERROR',
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="_route_onBoardingProcess">
      <form
        onSubmit={async (event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          EventEmitter.dispatch(Events.EVENT_SCROLL_TOP_MAIN_CONTAINER);
          push(
            CLIENT_ROUTE_SUBMIT_KYC_STEP_BY_ROLE.pathBuilder({
              issuerId,
              step:
                currentStepIndex < sections.length - 1
                  ? sections[currentStepIndex + 1].key
                  : KYC_SUBMIT_ROUTE,
            }),
          );
        }}
      >
        <Switch>
          {sections.map((section) => (
            <Route
              key={section.key}
              exact
              path={CLIENT_ROUTE_SUBMIT_KYC_STEP_BY_ROLE.pathBuilder({
                issuerId,
                step: section.key,
              })}
              render={(props) => (
                <KYCSection
                  {...props}
                  user={user}
                  issuerId={issuerId}
                  saveElement={saveElement}
                  isLoading={saving}
                  section={section}
                  templateName={template.name}
                />
              )}
            />
          ))}
          <Route
            key={KYC_SUBMIT_ROUTE}
            exact
            path={CLIENT_ROUTE_SUBMIT_KYC_STEP_BY_ROLE.pathBuilder({
              issuerId,
              step: KYC_SUBMIT_ROUTE,
            })}
            render={(props) => (
              <KycSubmission
                {...props}
                issuerId={issuerId}
                sections={sections}
                template={template}
                user={user}
              />
            )}
          />
          <Route
            render={() => (
              <Redirect
                to={CLIENT_ROUTE_SUBMIT_KYC_STEP_BY_ROLE.pathBuilder({
                  issuerId,
                  step:
                    kycCompletion.filter(({ complete }) => complete).length ===
                    kycCompletion.length
                      ? KYC_SUBMIT_ROUTE
                      : (kycCompletion.find(({ complete }) => !complete) || {})
                          .key || sections[0].key,
                })}
              />
            )}
          />
        </Switch>

        <footer>
          <Button
            label={intl.formatMessage(commonActionsTexts.back)}
            size="small"
            tertiary
            iconLeft={mdiArrowLeft}
            disabled={
              currentStepIndex === 0 ||
              (currentStepIndex > 0 &&
                sections[currentStepIndex - 1].key === 'investor-type') ||
              saving
            }
            onClick={async () => {
              EventEmitter.dispatch(Events.EVENT_SCROLL_TOP_MAIN_CONTAINER);
            }}
            href={CLIENT_ROUTE_SUBMIT_KYC_STEP_BY_ROLE.pathBuilder({
              issuerId,
              step:
                currentStepIndex > 0
                  ? sections[currentStepIndex - 1].key
                  : sections[sections.length - 1].key,
            })}
          />
          {step !== KYC_SUBMIT_ROUTE && (
            <Button
              type="submit"
              label={intl.formatMessage(commonActionsTexts.next)}
              size="small"
              disabled={
                saving ||
                (currentStepIndex < kycCompletion.length &&
                  (kycCompletion[currentStepIndex] || {}).rejected)
              }
            />
          )}
          {step === KYC_SUBMIT_ROUTE && (
            <Button
              label={intl.formatMessage(commonActionsTexts.submit)}
              size="small"
              isLoading={saving}
              onClick={submitKyc}
              disabled={atLeastOneRejected}
            />
          )}
        </footer>
      </form>

      <ProgressMenu
        step={step}
        kycCompletion={kycCompletion}
        saving={saving}
        exitHref={CLIENT_ROUTE_SUBMIT_KYC_BY_ROLE.pathBuilder({
          issuerId,
        })}
      />
    </div>
  );
};

export default OnBoardingProcess;
