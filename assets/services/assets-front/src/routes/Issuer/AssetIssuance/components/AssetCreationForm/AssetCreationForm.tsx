import React, { useEffect, useState } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  mdiPencil,
  mdiCheckCircle,
  mdiAlertOctagon,
  mdiArrowLeft,
  mdiPlaylistCheck,
  mdiBlockHelper,
  mdiDeleteOutline,
  mdiPencilOutline,
} from '@mdi/js';
import clsx from 'clsx';

import { DataCall } from 'utils/dataLayer';
import { CLIENT_ROUTE_ASSETS, CLIENT_ROUTE_ASSET_OVERVIEW } from 'routesList';
import { IToken, AssetType } from '../../templatesTypes';
import {
  API_DELETE_ASSET,
  API_DEPLOY_ASSET,
  API_REJECT_ASSET_DATA,
  API_SAVE_ASSET_DATA,
  API_SUBMIT_ASSET_DATA,
  API_UPDATE_ASSET_DATA,
} from 'constants/apiRoutes';
import {
  ITopSection,
  IAssetTemplate,
  IIssuanceElement,
  ISection,
} from '../../insuanceDataType';
import { ElementStatus } from '../../elementsTypes';
import { IUser, UserType } from 'User';
import i18n from 'utils/i18n';
import { commonActionsTexts } from 'texts/commun/actions';
import { colors } from 'constants/styles';

import Button from 'uiComponents/Button';
import MultiPageFormProgressMenu from 'uiComponents/MultiPageFormProgressMenu';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { appModalData } from 'uiComponents/AppModal/AppModal';

import FormField from '../FormField';
import AssetShareClassReviewForm from '../AssetShareClassReviewForm';

import './AssetCreationFormStyles.scss';
import AssetFacilitiesReviewForm from '../AssetFacilitiesReviewForm';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { getConfig } from 'utils/configUtils';
import { getSelectedChainId, getSelectedNetworkKey } from 'utils/configs';
import { assetCreationFormMessages } from 'texts/routes/issuer/assetIssuance';
import { CommonTexts } from 'texts/commun/commonTexts';
import Input from 'uiComponents/Input';
import { TxStatus } from 'Transaction';
import {
  convertTimeAndDateToUTC,
  getTimeDateFormRelatedElement,
  getDateTimeFormElementPrefix,
  TimestampBreakdown,
  isTimeOrDateFormElement,
  TIME_ELEMENT_SUFFIX,
  DATE_ELEMENT_SUFFIX,
} from 'utils/dateTime';
import { AssetCreationFlow } from '../../assetTypes';
import { setAppModal, userSelector } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';
import { useCallback } from 'react';

const getStepsParams = (
  generalSection: ITopSection,
): {
  mandatoryCount: number;
  dataCount: number;
} => {
  let mandatoryCount = 0;
  let dataCount = 0;
  for (const section of generalSection.sections) {
    for (const item of section.elements) {
      if (
        item.status === ElementStatus.mandatory ||
        item.status === ElementStatus.conditionalMandatory
      ) {
        mandatoryCount++;
        if (item.data && item.data.length > 0) {
          dataCount++;
        }
      }
    }
  }
  return {
    mandatoryCount,
    dataCount,
  };
};

export enum ViewMode {
  edit = 'edit',
  review = 'review',
  shareClasses = 'shareClasses',
}

interface IProps extends WrappedComponentProps, RouteComponentProps {
  template: IAssetTemplate;
  token: IToken;
  generalSection: ITopSection;
  combineSections: boolean;
  isDeployed: boolean;
  isMultipartiteFlow: boolean;
  workflowInstanceState: string;
  users: Array<IUser>;
}

interface IState {
  currentSection: number | 'general';
  viewMode: ViewMode;
  isSaving: boolean;
  isSaved: boolean;
  shareClasses: Array<ITopSection>;
  generalSection: ITopSection;
  defaultChainId: string; // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
  defaultNetworkKey: string;
  hasSavingError: boolean;
  currentUser: IUser;
}
const AssetCreationForm: React.FC<IProps> = ({
  generalSection,
  combineSections,
  isDeployed,
  template,
  users,
  intl,
  isMultipartiteFlow,
  workflowInstanceState,
  token,
  history,
}) => {
  const user = useSelector(userSelector) as IUser;
  const dispatch = useDispatch();
  const [state, setState] = useState<IState>({
    shareClasses: [],
    generalSection: generalSection,
    currentSection: 'general',
    viewMode: ViewMode.edit,
    isSaving: false,
    isSaved: false,
    hasSavingError: false,
    defaultChainId: '', // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
    defaultNetworkKey: '',
    currentUser: user,
  });
  const isTripartiteFlow =
    token.data.assetCreationFlow === AssetCreationFlow.TRI_PARTY;

  const isBipartiteFlow =
    token.data.assetCreationFlow === AssetCreationFlow.BI_PARTY;

  const loadSelectedNetwork = useCallback(async () => {
    try {
      const config = getConfig();
      setState((s) => ({
        ...s,
        defaultChainId: getSelectedChainId(config), // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
      }));
      setState((s) => ({
        ...s,
        defaultNetworkKey: getSelectedNetworkKey(config),
      }));
    } catch (error) {}
  }, []);

  const setReviewMode = useCallback(async () => {
    try {
      if (
        ((state.currentUser.userType === UserType.INVESTOR ||
          state.currentUser.userType === UserType.ISSUER) &&
          isTripartiteFlow) ||
        (state.currentUser.userType === UserType.ISSUER && isBipartiteFlow) ||
        (state.currentUser.userType === UserType.UNDERWRITER &&
          workflowInstanceState === TxStatus.REJECTED &&
          isTripartiteFlow) ||
        (state.currentUser.userType === UserType.INVESTOR &&
          workflowInstanceState === TxStatus.REJECTED &&
          isBipartiteFlow)
      )
        setState((s) => ({
          ...s,
          viewMode: ViewMode.review,
        }));
    } catch (error) {}
  }, [
    isBipartiteFlow,
    isTripartiteFlow,
    state.currentUser.userType,
    workflowInstanceState,
  ]);

  const onUpdateState = async (key: string, value: string[]) => {
    const { currentSection } = state;

    if (currentSection === 'general') {
      const generalSection = { ...state.generalSection };
      // Save the data in the form
      // We probably should have a more elegant way of doing things
      sectionsLoop: for (const section of generalSection.sections) {
        for (const item of section.elements) {
          if (item.key === key) {
            if (JSON.stringify(item.data) !== JSON.stringify(value)) {
              item.data = value;
              break sectionsLoop;
            }
          }
        }
      }

      setState((s) => ({
        ...s,
        generalSection,
      }));
    } else {
      const { shareClasses } = state;
      const currentShareClass = {
        ...shareClasses[currentSection],
      };
      // Save the data in the form
      // We probably should have a more elegant way of doing things
      sectionsLoop: for (const section of currentShareClass.sections) {
        for (const item of section.elements) {
          if (item.key === key) {
            if (JSON.stringify(item.data) !== JSON.stringify(value)) {
              item.data = value;
              break sectionsLoop;
            }
          }
        }
      }

      const updatedShareClasses = [
        ...shareClasses.slice(0, currentSection),
        currentShareClass,
        ...shareClasses.slice(currentSection + 1),
      ];

      setState((s) => ({
        ...s,
        shareClasses: updatedShareClasses,
      }));
    }
  };

  const submitGeneralSection = async (cb: () => void) => {
    const { generalSection } = state;
    const elementInstances = [];
    let reviewerId;

    // Save the data in the form
    // We probably should have a more elegant way of doing things
    for (const section of generalSection.sections) {
      for (const item of section.elements) {
        if (isTripartiteFlow && item.map === 'asset_participants_reviewerId') {
          reviewerId = item.data[0];
        }
        elementInstances.push({
          key: item.key,
          value: item.data,
        });
      }
    }

    await DataCall({
      method: API_UPDATE_ASSET_DATA.method,
      path: API_UPDATE_ASSET_DATA.path(),
      body: {
        tokenId: token.id,
        reviewerId,
        elementInstances,
      },
    });

    cb();

    setState((s) => ({
      ...s,
      isSaving: false,
      isSaved: true,
      hasSavingError: false,
    }));
  };

  const submitCurrentSection = async (cb: () => void) => {
    const { currentSection, defaultChainId, defaultNetworkKey } = state;
    const elementInstances = [];
    const shareClasses = state.shareClasses;
    // Save the data in the form
    // We probably should have a more elegant way of doing things
    let classKey: string | undefined;

    const DateTimeKeyMap: Map<string, TimestampBreakdown> = new Map();

    for (const section of shareClasses[currentSection as number].sections) {
      for (const item of section.elements) {
        if (item.map === 'class_general_name') {
          classKey = item.data[0]
            ? item.data[0]?.toLowerCase()?.replace(/\s/g, '_')
            : undefined;
        }

        let value = item.data;

        if (isTimeOrDateFormElement(item) && item.data.length) {
          const isTimeElement = item.key.endsWith(TIME_ELEMENT_SUFFIX);
          const keyPrefix = getDateTimeFormElementPrefix(item.key);
          const relatedElement = getTimeDateFormRelatedElement(
            section,
            keyPrefix,
            isTimeElement ? TIME_ELEMENT_SUFFIX : DATE_ELEMENT_SUFFIX,
          );

          if (relatedElement) {
            let mappedDateTime = DateTimeKeyMap.get(keyPrefix);
            const dateElement = isTimeElement ? relatedElement : item;
            const timeElement = isTimeElement ? item : relatedElement;

            if (!mappedDateTime) {
              mappedDateTime = convertTimeAndDateToUTC({
                time: timeElement.data[0],
                date: dateElement.data[0],
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              });

              DateTimeKeyMap.set(keyPrefix, mappedDateTime);
            }

            value = isTimeElement
              ? [mappedDateTime.time]
              : [mappedDateTime.date];
          }
        }

        elementInstances.push({
          key: item.key,
          value,
        });
      }
    }

    if (!classKey) {
      classKey = 'classic';
    }

    await DataCall({
      method: API_UPDATE_ASSET_DATA.method,
      path: API_UPDATE_ASSET_DATA.path(),
      body: {
        tokenId: token.id,
        chainId: !defaultChainId ? undefined : defaultChainId, // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
        networkKey: !defaultNetworkKey ? undefined : defaultNetworkKey,
        elementInstances: elementInstances.map((e) => ({
          ...e,
          classKey,
        })),
        assetClasses: [classKey],
      },
    });

    cb();

    setState((s) => ({
      ...s,
      isSaving: false,
      isSaved: true,
      hasSavingError: false,
    }));
  };

  const saveElementInstances = async (cb: () => void) => {
    if (isDeployed) {
      cb();
      return;
    }

    try {
      const { currentSection } = state;
      setState((s) => ({
        ...s,
        isSaving: true,
        isSaved: false,
        hasSavingError: false,
      }));

      if (currentSection === 'general') {
        return await submitGeneralSection(cb);
      }

      return await submitCurrentSection(cb);
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
      setState((s) => ({
        ...s,
        isSaving: false,
        isSaved: false,
        hasSavingError: true,
      }));
    }
  };

  const deployAsset = async (): Promise<void> => {
    try {
      setState((s) => ({ ...s, isSaving: true }));

      if (
        user.userType === UserType.UNDERWRITER ||
        user.userType === UserType.INVESTOR
      ) {
        await DataCall({
          method: API_SUBMIT_ASSET_DATA.method,
          path: API_SUBMIT_ASSET_DATA.path(),
          body: {
            tokenId: token.id,
            sendNotification: true,
          },
        });
      } else {
        await DataCall({
          method: API_DEPLOY_ASSET.method,
          path: API_DEPLOY_ASSET.path(),
          body: {
            tokenId: token.id,
            sendNotification: true,
          },
        });
      }

      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message:
            user.userType === UserType.UNDERWRITER
              ? intl.formatMessage(
                  assetCreationFormMessages.assetSubmittedUnderwriter,
                )
              : user.userType === UserType.INVESTOR
              ? intl.formatMessage(
                  assetCreationFormMessages.assetSubmittedInvestor,
                )
              : intl.formatMessage(assetCreationFormMessages.assetCreated),
          secondaryMessage:
            user.userType === UserType.UNDERWRITER
              ? intl.formatMessage(
                  assetCreationFormMessages.assetSubmittedContextUnderwriter,
                )
              : user.userType === UserType.INVESTOR
              ? intl.formatMessage(
                  assetCreationFormMessages.assetSubmittedContextInvestor,
                )
              : intl.formatMessage(
                  assetCreationFormMessages.assetCreatedContext,
                ),
          icon: mdiCheckCircle,
          color: colors.success,
          isDark: true,
        }),
      );

      history.push(CLIENT_ROUTE_ASSETS);
    } catch (error) {
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(
            assetCreationFormMessages.assetCreationError,
          ),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    } finally {
      setState((s) => ({ ...s, isSaving: false }));
    }
  };

  const rejectAsset = async (comment: string): Promise<void> => {
    try {
      const body = {
        tokenId: token.id,
        comment,
        sendNotification: true,
      };
      await DataCall({
        method: API_REJECT_ASSET_DATA.method,
        path: API_REJECT_ASSET_DATA.path(),
        body,
      });

      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(assetCreationFormMessages.assetRejected),
          secondaryMessage: intl.formatMessage(
            assetCreationFormMessages.assetRejectedContext,
          ),
          icon: mdiCheckCircle,
          color: colors.success,
          isDark: true,
        }),
      );

      history.push(CLIENT_ROUTE_ASSETS);
    } catch (error) {
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(
            assetCreationFormMessages.assetRejectedError,
          ),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    } finally {
      setState((s) => ({ ...s, isSaving: false }));
    }
  };

  const deleteAsset = async (): Promise<void> => {
    try {
      await DataCall({
        method: API_DELETE_ASSET.method,
        path: API_DELETE_ASSET.path(token.id),
      });

      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(assetCreationFormMessages.assetDeleted),
          icon: mdiCheckCircle,
          color: colors.success,
          isDark: true,
        }),
      );

      history.push(CLIENT_ROUTE_ASSETS);
    } catch (error) {
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(
            assetCreationFormMessages.assetDeletedError,
          ),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    } finally {
      setState((s) => ({ ...s, isSaving: false }));
    }
  };

  const addShareClass = async () => {
    const newShareClass = (template as IAssetTemplate).topSections.find(
      (topSection) => topSection.key === 'class',
    );

    if (!newShareClass) {
      return;
    }

    setState((s) => ({
      ...s,
      viewMode: ViewMode.edit,
      shareClasses: [...state.shareClasses, newShareClass],
      currentSection: state.shareClasses.length,
    }));
  };

  const updateAsset = async (): Promise<void> => {
    try {
      setState((s) => ({ ...s, isSaving: true }));

      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(assetCreationFormMessages.assetUpdated),
          icon: mdiCheckCircle,
          color: colors.success,
          isDark: true,
        }),
      );

      history.push(
        CLIENT_ROUTE_ASSET_OVERVIEW.pathBuilder({
          assetId: token.id,
        }),
      );
    } catch (error) {
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(
            assetCreationFormMessages.assetUpdatedError,
          ),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    } finally {
      setState((s) => ({ ...s, isSaving: false }));
    }
  };

  const updateAssetUpdatableElements = async (): Promise<void> => {
    try {
      const { generalSection, shareClasses } = state;

      const elementInstances = [];
      //send only updatable element instances
      //Push element instances from general instances that have updatable == true
      for (const section of generalSection.sections) {
        for (const item of section.elements) {
          if (item.updatable === true) {
            elementInstances.push({
              key: item.key,
              value: item.data,
            });
          }
        }
      }

      //Push element instances from share class section that have updatable == true
      const key = token.assetData?.class[0].key;

      for (const section of shareClasses) {
        for (const singleSection of section.sections) {
          for (const item of singleSection.elements) {
            if (item.updatable === true) {
              elementInstances.push({
                key: item.key,
                value: item.data,
                classKey: key ? key : 'classic',
              });
            }
          }
        }
      }

      await DataCall({
        method: API_SAVE_ASSET_DATA.method,
        path: API_SAVE_ASSET_DATA.path(),
        body: {
          tokenId: token.id,
          templateId: template.id,
          elementInstances,
        },
      });

      setState((s) => ({
        ...s,
        isSaving: false,
        isSaved: true,
        hasSavingError: false,
      }));

      setState((s) => ({ ...s, isSaving: true }));

      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(assetCreationFormMessages.assetUpdated),
          icon: mdiCheckCircle,
          color: colors.success,
          isDark: true,
        }),
      );

      history.push(
        CLIENT_ROUTE_ASSET_OVERVIEW.pathBuilder({
          assetId: token.id,
        }),
      );
    } catch (error) {
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(
            assetCreationFormMessages.assetUpdatedError,
          ),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    } finally {
      setState((s) => ({ ...s, isSaving: false }));
    }
  };

  useEffect(() => {
    loadSelectedNetwork();
    setReviewMode();
  }, [loadSelectedNetwork, setReviewMode]);

  const {
    currentSection,
    isSaving,
    isSaved,
    shareClasses,
    viewMode,
    hasSavingError,
    currentUser,
  } = state;

  const currentTopSection =
    currentSection === 'general'
      ? generalSection
      : shareClasses[currentSection];

  const shareClass = (template as IAssetTemplate).topSections.find(
    (topSection) => topSection.key === 'class',
  );

  const { mandatoryCount, dataCount } = getStepsParams(generalSection);

  const generalSectionSteps = {
    filledFields: dataCount,
    totalFields: mandatoryCount,
    name: i18n(intl.locale, generalSection.label),
  };

  const shareClassesLabel = shareClass?.label
    ? i18n(intl.locale, shareClass.label)
    : '';

  const shareClassSteps = {
    filledFields: 0,
    totalFields: 0,
    name: shareClassesLabel,
  };
  if (viewMode === ViewMode.shareClasses) {
    return (
      <div id="_routes_issuer_assetCreationForm">
        <div>
          {template.type === AssetType.SYNDICATED_LOAN ? (
            <AssetFacilitiesReviewForm
              viewMode={viewMode}
              shareClasses={shareClasses}
              addShareClass={addShareClass}
              setCurrentSectionAndViewMode={(
                currentSection: number | 'general',
                viewMode: ViewMode,
              ) => {
                setState((s) => ({
                  ...s,
                  currentSection,
                  viewMode,
                }));
              }}
            />
          ) : (
            <AssetShareClassReviewForm
              viewMode={viewMode}
              shareClasses={shareClasses}
              addShareClass={addShareClass}
              setCurrentSectionAndViewMode={(
                currentSection: number | 'general',
                viewMode: ViewMode,
              ) => {
                setState((s) => ({
                  ...s,
                  currentSection,
                  viewMode,
                }));
              }}
            />
          )}
        </div>
        {!isDeployed && (
          <MultiPageFormProgressMenu
            isSaving={isSaving}
            isSaved={isSaved}
            hasSavingError={hasSavingError}
            currentStep={1}
            steps={[generalSectionSteps, shareClassSteps]}
            onExit={async () => {
              await saveElementInstances(() => {
                history.push(CLIENT_ROUTE_ASSETS);
              });
            }}
          />
        )}
      </div>
    );
  }

  const isAddNextShareClass =
    currentTopSection.key === 'asset' &&
    viewMode === ViewMode.edit &&
    shareClasses.length === 0 &&
    !combineSections;

  const isNextReviewShareClassInformation =
    viewMode === ViewMode.edit && currentTopSection.key === 'class';

  const isBondReview =
    viewMode === ViewMode.review && template.type === AssetType.FIXED_RATE_BOND;

  const newShareClass = (template as IAssetTemplate).topSections.find(
    (topSection) => topSection.key === 'class',
  );

  const topSectionsToShow = isBondReview
    ? [generalSection, newShareClass]
    : [currentTopSection];
  interface allSectionsForReviewI {
    sections: ISection[];
  }

  const allSectionsForReview: allSectionsForReviewI = {
    sections: [],
  };
  if (isBondReview && newShareClass) {
    allSectionsForReview.sections = [
      ...generalSection.sections,
      ...newShareClass.sections,
    ];
  }

  const allElementsForReview = allSectionsForReview.sections.reduce(
    (secs: Array<IIssuanceElement>, sec) => [...secs, ...sec.elements],
    [],
  );

  return (
    <>
      {!isMultipartiteFlow && (
        <div id="_routes_issuer_assetCreationForm">
          <form
            onSubmit={async (event: React.FormEvent<HTMLFormElement>) => {
              try {
                event.preventDefault();
                if (!combineSections) {
                  if (isAddNextShareClass) {
                    await saveElementInstances(() => {
                      addShareClass();
                    });
                  } else if (isNextReviewShareClassInformation) {
                    await saveElementInstances(() => {
                      setState((s) => ({
                        ...s,
                        viewMode: ViewMode.review,
                      }));
                    });
                  }
                } else {
                  await saveElementInstances(() => {
                    setState((s) => ({
                      ...s,
                      viewMode: ViewMode.review,
                    }));
                  });
                }
                EventEmitter.dispatch(Events.EVENT_SCROLL_TOP_MAIN_CONTAINER);
              } catch (error) {}
            }}>
            <header>
              {!isBondReview ? (
                <>
                  <h2>{i18n(intl.locale, currentTopSection.label)}</h2>
                </>
              ) : (
                <>
                  <h2 style={{ margin: 0 }}>
                    {intl.formatMessage(CommonTexts.review)}
                  </h2>
                  <label
                    className="subLabel"
                    style={{
                      fontSize: '14px',
                      lineHeight: '32px',
                    }}>
                    {intl.formatMessage(assetCreationFormMessages.reviewDesc)}
                  </label>
                </>
              )}

              {!isDeployed &&
                typeof currentSection === 'number' &&
                shareClasses.length === 1 &&
                viewMode === ViewMode.edit &&
                shareClasses[0].legend && (
                  <p className="shareClassBaseline">
                    {i18n(intl.locale, shareClasses[0].legend)}
                  </p>
                )}
            </header>
            {topSectionsToShow.map((topSection) => (
              <React.Fragment
                key={i18n(intl.locale, topSection?.label || { key: 'Asset' })}>
                {isBondReview && (
                  <h2>
                    {i18n(intl.locale, topSection?.label || { key: 'Asset' })}
                  </h2>
                )}
                {topSection?.sections.map((section) => (
                  <div
                    key={i18n(intl.locale, section.label)}
                    className={clsx({
                      reviewSection: viewMode === ViewMode.review,
                    })}>
                    <h3>
                      {i18n(intl.locale, section.label)}
                      {viewMode === ViewMode.review && (
                        <Button
                          label={intl.formatMessage(
                            assetCreationFormMessages.editButton,
                          )}
                          iconLeft={mdiPencil}
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              viewMode: ViewMode.edit,
                            }))
                          }
                          size="small"
                          tertiary
                        />
                      )}
                    </h3>
                    {viewMode === ViewMode.edit && section.description && (
                      <p className="baseLine">
                        {i18n(intl.locale, section.description)}
                      </p>
                    )}
                    {section.elements
                      .filter(
                        (element) =>
                          element.status !==
                            ElementStatus.conditionalMandatory &&
                          element.status !==
                            ElementStatus.conditionalOptional &&
                          element.map !== 'asset_participants_reviewerId',
                      )
                      .map((element) => {
                        return (
                          <FormField
                            key={element.key}
                            element={element}
                            users={users}
                            onUpdateData={(key, value) =>
                              onUpdateState(key, value)
                            }
                            reviewMode={
                              viewMode === ViewMode.review ||
                              (isDeployed &&
                                element.key.indexOf('_cutoff_') === -1)
                            }
                            elements={currentTopSection.sections.reduce(
                              (secs: Array<IIssuanceElement>, sec) => [
                                ...secs,
                                ...sec.elements,
                              ],
                              [],
                            )}
                          />
                        );
                      })}
                  </div>
                ))}
              </React.Fragment>
            ))}

            {viewMode === ViewMode.review &&
              currentSection === 'general' &&
              !combineSections && (
                <>
                  {template.type === AssetType.SYNDICATED_LOAN ? (
                    <AssetFacilitiesReviewForm
                      viewMode={viewMode}
                      shareClasses={shareClasses}
                      isReviewMode
                      addShareClass={addShareClass}
                      setCurrentSectionAndViewMode={(
                        currentSection: number | 'general',
                        viewMode: ViewMode,
                      ) => {
                        setState((s) => ({
                          ...s,
                          currentSection,
                          viewMode,
                        }));
                      }}
                    />
                  ) : (
                    <AssetShareClassReviewForm
                      viewMode={viewMode}
                      shareClasses={shareClasses}
                      isReviewMode
                      addShareClass={addShareClass}
                      setCurrentSectionAndViewMode={(
                        currentSection: number | 'general',
                        viewMode: ViewMode,
                      ) => {
                        setState((s) => ({
                          ...s,
                          currentSection,
                          viewMode,
                        }));
                      }}
                    />
                  )}
                </>
              )}

            {!isDeployed &&
              !isBondReview &&
              currentTopSection.key === 'class' &&
              viewMode === ViewMode.review && (
                <div className="reviewSection">
                  <h3>
                    {intl.formatMessage(assetCreationFormMessages.deleteLabel, {
                      item: shareClassesLabel,
                    })}
                  </h3>

                  <h4 className="baseLine">
                    {intl.formatMessage(
                      assetCreationFormMessages.deleteDescription,
                      { item: shareClassesLabel },
                    )}
                  </h4>

                  <div style={{ width: '100%' }}>
                    <Button
                      label={intl.formatMessage(
                        assetCreationFormMessages.deleteButton,
                      )}
                      color={colors.errorDark}
                      onClick={() => {
                        const newShareClasses = [...shareClasses];
                        newShareClasses.splice(currentSection as number);
                        setState((s) => ({
                          ...s,
                          shareClasses: newShareClasses,
                          viewMode: ViewMode.shareClasses,
                        }));
                      }}
                    />
                  </div>
                </div>
              )}

            <footer>
              {combineSections && viewMode === ViewMode.edit && (
                <Button
                  type="submit"
                  label={intl.formatMessage(
                    assetCreationFormMessages.nextReview,
                  )}
                />
              )}
              {isAddNextShareClass && (
                <Button
                  type="submit"
                  label={intl.formatMessage(
                    isDeployed
                      ? assetCreationFormMessages.nextUpdateItem
                      : assetCreationFormMessages.nextAddItem,
                    { item: shareClassesLabel },
                  )}
                />
              )}

              {currentTopSection.key === 'asset' &&
                viewMode === ViewMode.edit &&
                shareClasses.length > 0 && (
                  <Button
                    label={intl.formatMessage(
                      assetCreationFormMessages.seeItem,
                      {
                        item: shareClassesLabel,
                      },
                    )}
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        viewMode: ViewMode.shareClasses,
                      }))
                    }
                  />
                )}

              {((currentTopSection.key === 'asset' &&
                viewMode === ViewMode.review) ||
                isBondReview) && (
                <div>
                  <Button
                    type="button"
                    label={intl.formatMessage(commonActionsTexts.back)}
                    tertiary
                    iconLeft={mdiArrowLeft}
                    onClick={() => {
                      setState((s) => ({
                        ...s,
                        viewMode:
                          !combineSections && !isBondReview
                            ? ViewMode.shareClasses
                            : ViewMode.edit,
                      }));
                      EventEmitter.dispatch(
                        Events.EVENT_SCROLL_TOP_MAIN_CONTAINER,
                      );
                    }}
                  />
                  {isDeployed ? (
                    <Button
                      type="button"
                      disabled
                      isLoading={isSaving}
                      label={intl.formatMessage(
                        assetCreationFormMessages.updateAssetLabel,
                      )}
                      onClick={() => {
                        dispatch(
                          setAppModal(
                            appModalData({
                              title: intl.formatMessage(
                                assetCreationFormMessages.updateAssetLabel,
                              ),
                              content: intl.formatMessage(
                                assetCreationFormMessages.updateAssetDescription,
                              ),
                              confirmLabel: intl.formatMessage(
                                assetCreationFormMessages.updateAssetConfirmLabel,
                              ),
                              confirmAction: updateAsset,
                            }),
                          ),
                        );
                      }}
                    />
                  ) : (
                    <Button
                      type="button"
                      isLoading={isSaving}
                      label={intl.formatMessage(
                        assetCreationFormMessages.createAssetLabel,
                      )}
                      onClick={() => {
                        dispatch(
                          setAppModal(
                            appModalData({
                              title: intl.formatMessage(
                                assetCreationFormMessages.createAssetLabel,
                              ),
                              content: intl.formatMessage(
                                assetCreationFormMessages.createAssetDescription,
                              ),
                              confirmLabel: intl.formatMessage(
                                assetCreationFormMessages.createAssetConfirmLabel,
                              ),
                              confirmAction: deployAsset,
                            }),
                          ),
                        );
                      }}
                    />
                  )}
                </div>
              )}

              {isNextReviewShareClassInformation && !isBondReview && (
                <div>
                  <Button
                    type="button"
                    label={intl.formatMessage(commonActionsTexts.back)}
                    iconLeft={mdiArrowLeft}
                    tertiary
                    onClick={() => {
                      setState((s) => ({
                        ...s,
                        currentSection: 'general',
                        shareClasses: [],
                      }));
                      EventEmitter.dispatch(
                        Events.EVENT_SCROLL_TOP_MAIN_CONTAINER,
                      );
                    }}
                  />
                  <Button
                    type="submit"
                    label={
                      template.type === AssetType.FIXED_RATE_BOND
                        ? intl.formatMessage(
                            assetCreationFormMessages.nextReview,
                          )
                        : intl.formatMessage(
                            assetCreationFormMessages.nextReviewItem,
                            { item: shareClassesLabel },
                          )
                    }
                  />
                </div>
              )}

              {viewMode === ViewMode.review &&
                !isBondReview &&
                currentTopSection.key === 'class' && (
                  <div>
                    <Button
                      type="button"
                      label={intl.formatMessage(commonActionsTexts.back)}
                      iconLeft={mdiArrowLeft}
                      tertiary
                      onClick={() => {
                        setState((s) => ({ ...s, viewMode: ViewMode.edit }));
                        EventEmitter.dispatch(
                          Events.EVENT_SCROLL_TOP_MAIN_CONTAINER,
                        );
                      }}
                    />
                    <Button
                      label={intl.formatMessage(
                        assetCreationFormMessages.nextSaveItem,
                        { item: shareClassesLabel },
                      )}
                      onClick={() => {
                        setState((s) => ({
                          ...s,
                          viewMode: ViewMode.shareClasses,
                        }));
                        EventEmitter.dispatch(
                          Events.EVENT_SCROLL_TOP_MAIN_CONTAINER,
                        );
                      }}
                    />
                  </div>
                )}
            </footer>
          </form>

          {!isDeployed && (
            <MultiPageFormProgressMenu
              isSaving={isSaving}
              isSaved={isSaved}
              hasSavingError={hasSavingError}
              currentStep={currentSection === 'general' ? 0 : 1}
              steps={
                !combineSections
                  ? [generalSectionSteps, shareClassSteps]
                  : [generalSectionSteps]
              }
              onExit={async () => {
                await saveElementInstances(() => {
                  history.push(CLIENT_ROUTE_ASSETS);
                });
              }}
            />
          )}
        </div>
      )}
      {isMultipartiteFlow && (
        <div id="_routes_issuer_assetCreationForm">
          <form
            onSubmit={async (event: React.FormEvent<HTMLFormElement>) => {
              try {
                event.preventDefault();
                if (!combineSections) {
                  if (isAddNextShareClass) {
                    await saveElementInstances(() => {
                      addShareClass();
                    });
                  } else if (isNextReviewShareClassInformation) {
                    await saveElementInstances(() => {
                      setState((s) => ({
                        ...s,
                        viewMode: ViewMode.review,
                      }));
                    });
                  }
                } else {
                  setState((s) => ({
                    ...s,
                    viewMode: ViewMode.review,
                  }));
                }
                EventEmitter.dispatch(Events.EVENT_SCROLL_TOP_MAIN_CONTAINER);
              } catch (error) {}
            }}>
            <header>
              {!isBondReview ? (
                <>
                  <h2>{i18n(intl.locale, currentTopSection.label)}</h2>
                </>
              ) : (
                <>
                  <h2 style={{ margin: 0 }}>
                    {intl.formatMessage(CommonTexts.review)}
                  </h2>
                  <label
                    className="subLabel"
                    style={{
                      fontSize: '14px',
                      lineHeight: '32px',
                    }}>
                    {intl.formatMessage(assetCreationFormMessages.reviewDesc)}
                  </label>
                </>
              )}

              {!isDeployed &&
                typeof currentSection === 'number' &&
                shareClasses.length === 1 &&
                viewMode === ViewMode.edit &&
                shareClasses[0].legend && (
                  <p className="shareClassBaseline">
                    {i18n(intl.locale, shareClasses[0].legend)}
                  </p>
                )}
            </header>
            {topSectionsToShow.map((topSection) => (
              <React.Fragment
                key={i18n(intl.locale, topSection?.label || { key: 'Asset' })}>
                {isBondReview && (
                  <h2>
                    {i18n(intl.locale, topSection?.label || { key: 'Asset' })}
                  </h2>
                )}
                {topSection?.sections.map((section) => (
                  <div
                    key={i18n(intl.locale, section.label)}
                    className={clsx({
                      reviewSection: viewMode === ViewMode.review,
                    })}>
                    <h3>
                      {i18n(intl.locale, section.label)}
                      {viewMode === ViewMode.review &&
                        ((isTripartiteFlow &&
                          currentUser.userType === UserType.UNDERWRITER) ||
                          (isTripartiteFlow &&
                            currentUser.userType === UserType.ISSUER) ||
                          (isBipartiteFlow &&
                            currentUser.userType === UserType.INVESTOR)) && (
                          <Button
                            label={intl.formatMessage(
                              assetCreationFormMessages.editButton,
                            )}
                            iconLeft={mdiPencil}
                            onClick={() =>
                              setState((s) => ({
                                ...s,
                                viewMode: ViewMode.edit,
                              }))
                            }
                            size="small"
                            tertiary
                          />
                        )}
                    </h3>
                    {viewMode === ViewMode.edit && section.description && (
                      <p className="baseLine">
                        {i18n(intl.locale, section.description)}
                      </p>
                    )}
                    {section.elements
                      .filter(
                        (element) =>
                          element.status !==
                            ElementStatus.conditionalMandatory &&
                          element.status !==
                            ElementStatus.conditionalOptional &&
                          (element.map !== 'asset_participants_reviewerId' ||
                            !isBipartiteFlow),
                      )
                      .map((element) => {
                        if (element.map === 'asset_participants_reviewerId') {
                          element.status = ElementStatus.mandatory;
                        }
                        return (
                          <FormField
                            key={element.key}
                            element={element}
                            users={users}
                            onUpdateData={(key, value) =>
                              onUpdateState(key, value)
                            }
                            reviewMode={
                              viewMode === ViewMode.review ||
                              (isDeployed && element.updatable === false)
                            }
                            elements={
                              allElementsForReview.length !== 0
                                ? allElementsForReview
                                : currentTopSection.sections.reduce(
                                    (secs: Array<IIssuanceElement>, sec) => [
                                      ...secs,
                                      ...sec.elements,
                                    ],
                                    [],
                                  )
                            }
                          />
                        );
                      })}
                  </div>
                ))}
              </React.Fragment>
            ))}

            {!isDeployed &&
              !isBondReview &&
              currentTopSection.key === 'class' &&
              viewMode === ViewMode.review && (
                <div className="reviewSection">
                  <h3>
                    {intl.formatMessage(assetCreationFormMessages.deleteLabel, {
                      item: shareClassesLabel,
                    })}
                  </h3>

                  <h4 className="baseLine">
                    {intl.formatMessage(
                      assetCreationFormMessages.deleteDescription,
                      { item: shareClassesLabel },
                    )}
                  </h4>

                  <div style={{ width: '100%' }}>
                    <Button
                      label={intl.formatMessage(
                        assetCreationFormMessages.deleteButton,
                      )}
                      color={colors.errorDark}
                      onClick={() => {
                        const newShareClasses = [...shareClasses];
                        newShareClasses.splice(currentSection as number);
                        setState((s) => ({
                          ...s,
                          shareClasses: newShareClasses,
                          viewMode: ViewMode.shareClasses,
                        }));
                      }}
                    />
                  </div>
                </div>
              )}

            <footer>
              {isDeployed &&
                !isAddNextShareClass &&
                currentUser.userType === UserType.ISSUER && (
                  <Button
                    type="button"
                    isLoading={isSaving}
                    label={intl.formatMessage(
                      assetCreationFormMessages.updateAssetLabel,
                    )}
                    onClick={() => {
                      dispatch(
                        setAppModal(
                          appModalData({
                            title: intl.formatMessage(
                              assetCreationFormMessages.updateAssetLabel,
                            ),
                            content: intl.formatMessage(
                              assetCreationFormMessages.updateAssetDescription,
                            ),
                            confirmLabel: intl.formatMessage(
                              assetCreationFormMessages.updateAssetConfirmLabel,
                            ),
                            confirmAction: updateAssetUpdatableElements,
                          }),
                        ),
                      );
                    }}
                  />
                )}

              {combineSections && viewMode === ViewMode.edit && (
                <Button
                  type="submit"
                  label={intl.formatMessage(
                    assetCreationFormMessages.nextReview,
                  )}
                />
              )}
              {isAddNextShareClass && (
                <Button
                  type="submit"
                  label={intl.formatMessage(
                    isDeployed
                      ? assetCreationFormMessages.nextUpdateAItem
                      : assetCreationFormMessages.nextAddItem,
                    { item: shareClassesLabel },
                  )}
                />
              )}

              {currentTopSection.key === 'asset' &&
                viewMode === ViewMode.edit &&
                shareClasses.length > 0 && (
                  <Button
                    label={intl.formatMessage(
                      assetCreationFormMessages.seeItem,
                      {
                        item: shareClassesLabel,
                      },
                    )}
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        viewMode: ViewMode.shareClasses,
                      }))
                    }
                  />
                )}

              {((currentTopSection.key === 'asset' &&
                viewMode === ViewMode.review) ||
                isBondReview) &&
                !(workflowInstanceState === TxStatus.REJECTED) &&
                currentUser.userType === UserType.UNDERWRITER && (
                  <div>
                    <Button
                      type="button"
                      label={intl.formatMessage(commonActionsTexts.back)}
                      tertiary
                      iconLeft={mdiArrowLeft}
                      onClick={() => {
                        setState((s) => ({
                          ...s,
                          viewMode:
                            !combineSections && !isBondReview
                              ? ViewMode.shareClasses
                              : ViewMode.edit,
                        }));
                        EventEmitter.dispatch(
                          Events.EVENT_SCROLL_TOP_MAIN_CONTAINER,
                        );
                      }}
                    />
                    <Button
                      type="button"
                      isLoading={isSaving}
                      label={intl.formatMessage(
                        assetCreationFormMessages.submitAssetLabel,
                      )}
                      onClick={deployAsset}
                    />
                  </div>
                )}

              {((currentTopSection.key === 'asset' &&
                viewMode === ViewMode.review) ||
                isBondReview) &&
                workflowInstanceState === TxStatus.REJECTED &&
                currentUser.userType === UserType.UNDERWRITER && (
                  <div>
                    <Button
                      type="button"
                      isLoading={isSaving}
                      label={intl.formatMessage(
                        assetCreationFormMessages.editAssetInformation,
                      )}
                      iconLeft={mdiPencilOutline}
                      onClick={() => {
                        setState((s) => ({
                          ...s,
                          viewMode: ViewMode.edit,
                        }));
                      }}
                    />
                    <Button
                      type="button"
                      isLoading={isSaving}
                      label={intl.formatMessage(
                        assetCreationFormMessages.deleteAsset,
                      )}
                      color={colors.errorDark}
                      iconLeft={mdiDeleteOutline}
                      tertiary
                      onClick={() => {
                        dispatch(
                          setAppModal(
                            appModalData({
                              title: intl.formatMessage(
                                assetCreationFormMessages.deleteAsset,
                              ),
                              content: intl.formatMessage(
                                assetCreationFormMessages.deleteAssetDescription,
                              ),
                              confirmLabel: intl.formatMessage(
                                assetCreationFormMessages.deleteButton,
                              ),
                              confirmColor: colors.errorDark,
                              confirmAction: deleteAsset,
                            }),
                          ),
                        );
                      }}
                    />
                  </div>
                )}

              {((currentTopSection.key === 'asset' &&
                viewMode === ViewMode.review) ||
                isBondReview) &&
                !isDeployed &&
                currentUser.userType === UserType.INVESTOR && (
                  <div>
                    <Button
                      type="button"
                      isLoading={isSaving}
                      label={
                        isBipartiteFlow
                          ? intl.formatMessage(
                              assetCreationFormMessages.investorSubmitAsset,
                            )
                          : intl.formatMessage(
                              assetCreationFormMessages.approveAndSubmitAsset,
                            )
                      }
                      iconLeft={mdiPlaylistCheck}
                      onClick={() => {
                        isBipartiteFlow
                          ? deployAsset()
                          : dispatch(
                              setAppModal(
                                appModalData({
                                  title: intl.formatMessage(
                                    assetCreationFormMessages.approveAndSubmitAsset,
                                  ),
                                  content: intl.formatMessage(
                                    assetCreationFormMessages.approveAndSubmitDescription,
                                  ),
                                  confirmLabel: intl.formatMessage(
                                    assetCreationFormMessages.approveConfirmLabel,
                                  ),
                                  confirmAction: deployAsset,
                                }),
                              ),
                            );
                      }}
                    />
                    {!isBipartiteFlow && (
                      <Button
                        type="button"
                        isLoading={isSaving}
                        label={intl.formatMessage(
                          assetCreationFormMessages.rejectInformationAsset,
                        )}
                        color={colors.errorDark}
                        iconLeft={mdiBlockHelper}
                        tertiary
                        onClick={() => {
                          dispatch(
                            setAppModal(
                              appModalData({
                                title: intl.formatMessage(
                                  assetCreationFormMessages.rejectInformationTitle,
                                ),
                                confirmAction: ({ comment }) =>
                                  rejectAsset(comment.value),
                                confirmLabel: intl.formatMessage(
                                  assetCreationFormMessages.rejectInformationAsset,
                                ),
                                confirmColor: colors.errorDark,
                                content: (
                                  <div style={{ width: 520 }}>
                                    <p>
                                      {intl.formatMessage(
                                        assetCreationFormMessages.rejectInformationDescription,
                                      )}
                                    </p>
                                    <Input
                                      type="textarea"
                                      label={intl.formatMessage(
                                        assetCreationFormMessages.reason,
                                      )}
                                      name="comment"
                                      required
                                    />
                                  </div>
                                ),
                              }),
                            ),
                          );
                        }}
                      />
                    )}
                  </div>
                )}

              {((currentTopSection.key === 'asset' &&
                viewMode === ViewMode.review) ||
                isBondReview) &&
                !isDeployed &&
                currentUser.userType === UserType.ISSUER && (
                  <div>
                    <Button
                      type="button"
                      isLoading={isSaving}
                      label={intl.formatMessage(
                        assetCreationFormMessages.approveAndCreateAsset,
                      )}
                      iconLeft={mdiPlaylistCheck}
                      onClick={() => {
                        dispatch(
                          setAppModal(
                            appModalData({
                              title: intl.formatMessage(
                                assetCreationFormMessages.createAssetLabel,
                              ),
                              content: isTripartiteFlow
                                ? intl.formatMessage(
                                    assetCreationFormMessages.approveAndCreateBondDescription,
                                  )
                                : intl.formatMessage(
                                    assetCreationFormMessages.approveAndCreateDescription,
                                    { issuerName: users[0].firstName },
                                  ),
                              confirmLabel: intl.formatMessage(
                                assetCreationFormMessages.createAssetLabel,
                              ),
                              confirmAction: deployAsset,
                            }),
                          ),
                        );
                      }}
                    />
                    <Button
                      type="button"
                      isLoading={isSaving}
                      label={intl.formatMessage(
                        assetCreationFormMessages.rejectInformationAsset,
                      )}
                      color={colors.errorDark}
                      iconLeft={mdiBlockHelper}
                      tertiary
                      onClick={() => {
                        dispatch(
                          setAppModal(
                            appModalData({
                              title: intl.formatMessage(
                                assetCreationFormMessages.rejectInformationTitle,
                              ),
                              confirmAction: ({ comment }) =>
                                rejectAsset(comment.value),
                              confirmLabel: intl.formatMessage(
                                assetCreationFormMessages.rejectInformationAsset,
                              ),
                              confirmColor: colors.errorDark,
                              content: (
                                <div style={{ width: 520 }}>
                                  <p>
                                    {intl.formatMessage(
                                      assetCreationFormMessages.rejectInformationDescription,
                                    )}
                                  </p>
                                  <Input
                                    type="textarea"
                                    label={intl.formatMessage(
                                      assetCreationFormMessages.reason,
                                    )}
                                    name="comment"
                                    required
                                  />
                                </div>
                              ),
                            }),
                          ),
                        );
                      }}
                    />
                  </div>
                )}
              {isNextReviewShareClassInformation &&
                !isBondReview &&
                !isDeployed && (
                  <div>
                    <Button
                      type="button"
                      label={intl.formatMessage(commonActionsTexts.back)}
                      iconLeft={mdiArrowLeft}
                      tertiary
                      onClick={() => {
                        setState((s) => ({
                          ...s,
                          currentSection: 'general',
                          shareClasses: [],
                        }));
                        EventEmitter.dispatch(
                          Events.EVENT_SCROLL_TOP_MAIN_CONTAINER,
                        );
                      }}
                    />
                    <Button
                      type="submit"
                      label={
                        template.type === AssetType.FIXED_RATE_BOND
                          ? intl.formatMessage(
                              assetCreationFormMessages.nextReview,
                            )
                          : intl.formatMessage(
                              assetCreationFormMessages.nextReviewItem,
                              { item: shareClassesLabel },
                            )
                      }
                    />
                  </div>
                )}

              {viewMode === ViewMode.review &&
                !isDeployed &&
                !isBondReview &&
                currentTopSection.key === 'class' && (
                  <div>
                    <Button
                      type="button"
                      label={intl.formatMessage(commonActionsTexts.back)}
                      iconLeft={mdiArrowLeft}
                      tertiary
                      onClick={() => {
                        setState((s) => ({ ...s, viewMode: ViewMode.edit }));
                        EventEmitter.dispatch(
                          Events.EVENT_SCROLL_TOP_MAIN_CONTAINER,
                        );
                      }}
                    />
                    <Button
                      label={intl.formatMessage(
                        assetCreationFormMessages.nextSaveItem,
                        { item: shareClassesLabel },
                      )}
                      onClick={() => {
                        setState((s) => ({
                          ...s,
                          viewMode: ViewMode.shareClasses,
                        }));
                        EventEmitter.dispatch(
                          Events.EVENT_SCROLL_TOP_MAIN_CONTAINER,
                        );
                      }}
                    />
                  </div>
                )}
            </footer>
          </form>

          {!isDeployed && state.viewMode === ViewMode.edit && (
            <MultiPageFormProgressMenu
              isSaving={isSaving}
              isSaved={isSaved}
              hasSavingError={hasSavingError}
              currentStep={currentSection === 'general' ? 0 : 1}
              steps={
                !combineSections
                  ? [generalSectionSteps, shareClassSteps]
                  : [generalSectionSteps]
              }
              onExit={async () => {
                await saveElementInstances(() => {
                  history.push(CLIENT_ROUTE_ASSETS);
                });
              }}
            />
          )}
        </div>
      )}
    </>
  );
};

export default injectIntl(withRouter(AssetCreationForm));
