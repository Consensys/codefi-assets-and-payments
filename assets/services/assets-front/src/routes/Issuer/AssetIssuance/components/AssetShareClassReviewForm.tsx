import React from 'react';
import { mdiBank, mdiArrowLeft } from '@mdi/js';

import { commonActionsTexts } from 'texts/commun/actions';
import Button from 'uiComponents/Button';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { ViewMode } from './AssetCreationForm/AssetCreationForm';

import { ITopSection as IDataTopSection } from '../insuanceDataType';
import Icon from 'uiComponents/Icon';
import { colors } from 'constants/styles';
import { useIntl } from 'react-intl';
import { assetShareClassReviewFormMessages } from 'texts/routes/issuer/assetIssuance';
import { useDispatch } from 'react-redux';
import { setAppModal } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps {
  viewMode: 'edit' | 'review' | 'shareClasses';
  isReviewMode?: boolean;
  shareClasses: Array<IDataTopSection>;
  addShareClass: () => void;
  setCurrentSectionAndViewMode: (
    currentSection: number | 'general',
    viewMode: ViewMode,
  ) => void;
}

const AssetShareClassReviewForm: React.FC<IProps> = ({
  shareClasses,
  addShareClass,
  setCurrentSectionAndViewMode,
  isReviewMode = false,
}: IProps) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const shareClassesReviewData = shareClasses.map((shareClass) => {
    let name;
    let ISIN;
    let date;

    for (const section of shareClass.sections) {
      for (const item of section.elements) {
        if (item.map === 'class_general_name') {
          name = item.data[0];
          break;
        }

        if (item.map === 'class_general_isin') {
          ISIN = item.data[0];
          break;
        }

        if (item.map === 'class_initialSubscription_cutoffDate') {
          date = item.data[0];
          break;
        }
      }
    }

    return { name, ISIN, date };
  });

  return (
    <>
      <header>
        <h2>
          {intl.formatMessage(assetShareClassReviewFormMessages.shareClasses)}
        </h2>
      </header>

      <table className="shareClassesList">
        <thead>
          <tr>
            <td>
              {intl.formatMessage(assetShareClassReviewFormMessages.shareClass)}
            </td>
            {shareClassesReviewData.length > 0 &&
              !!shareClassesReviewData[0].ISIN && (
                <td>
                  {intl.formatMessage(
                    assetShareClassReviewFormMessages.isinCode,
                  )}
                </td>
              )}
            <td>
              {intl.formatMessage(
                assetShareClassReviewFormMessages.subscriptionCutOffDate,
              )}
            </td>
            <td>
              {intl.formatMessage(assetShareClassReviewFormMessages.action)}
            </td>
          </tr>
        </thead>

        <tbody>
          {shareClassesReviewData.map(({ name, ISIN, date }, index) => {
            return (
              <tr key={index}>
                <td>
                  {name ? (
                    name
                  ) : (
                    <span>
                      {intl.formatMessage(
                        assetShareClassReviewFormMessages.notSet,
                      )}
                    </span>
                  )}
                </td>
                {shareClassesReviewData.length > 0 && !!ISIN && (
                  <td>
                    {ISIN ? (
                      ISIN
                    ) : (
                      <span>
                        {intl.formatMessage(
                          assetShareClassReviewFormMessages.notSet,
                        )}
                      </span>
                    )}
                  </td>
                )}
                <td>
                  {date ? (
                    date
                  ) : (
                    <span>
                      {intl.formatMessage(
                        assetShareClassReviewFormMessages.notSet,
                      )}
                    </span>
                  )}
                </td>
                <td>
                  <Button
                    label={intl.formatMessage(
                      assetShareClassReviewFormMessages.edit,
                    )}
                    tertiary
                    size="small"
                    onClick={() =>
                      setCurrentSectionAndViewMode(index, ViewMode.edit)
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {!isReviewMode && (
        <>
          <div>
            <Button
              label={intl.formatMessage(
                assetShareClassReviewFormMessages.addAShareClass,
              )}
              onClick={() => {
                if (shareClasses.length === 1) {
                  dispatch(
                    setAppModal(
                      appModalData({
                        title: intl.formatMessage(
                          assetShareClassReviewFormMessages.newShareClass,
                        ),
                        isSimpleAcknowledgement: true,
                        content: (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              maxWidth: 480,
                            }}
                          >
                            <Icon
                              width={50}
                              icon={mdiBank}
                              color={colors.main}
                            />
                            <h2
                              style={{
                                color: colors.main,
                                fontWeight: 600,
                                fontSize: 20,
                              }}
                            >
                              {intl.formatMessage(
                                assetShareClassReviewFormMessages.comingSoon,
                              )}
                            </h2>
                            <span
                              style={{
                                marginTop: 10,
                                textAlign: 'center',
                                fontSize: 14,
                              }}
                            >
                              {intl.formatMessage(
                                assetShareClassReviewFormMessages.comingSoonMessage,
                              )}
                            </span>
                          </div>
                        ),
                      }),
                    ),
                  );
                } else {
                  addShareClass();
                }
              }}
              secondary
              color="#666"
            />
          </div>

          <footer>
            <div>
              <Button
                type="button"
                label={intl.formatMessage(commonActionsTexts.back)}
                tertiary
                iconLeft={mdiArrowLeft}
                onClick={() => {
                  setCurrentSectionAndViewMode('general', ViewMode.edit);
                  EventEmitter.dispatch(Events.EVENT_SCROLL_TOP_MAIN_CONTAINER);
                }}
              />
              <Button
                label={intl.formatMessage(
                  assetShareClassReviewFormMessages.nextReview,
                )}
                onClick={() => {
                  setCurrentSectionAndViewMode('general', ViewMode.review);
                  EventEmitter.dispatch(Events.EVENT_SCROLL_TOP_MAIN_CONTAINER);
                }}
              />
            </div>
          </footer>
        </>
      )}
    </>
  );
};

export default AssetShareClassReviewForm;
