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

// TODO: Move strings to translation keys

const AssetFacilitiesReviewForm: React.FC<IProps> = ({
  shareClasses,
  addShareClass,
  setCurrentSectionAndViewMode,
  isReviewMode = false,
}: IProps) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const shareClassesReviewData = shareClasses.map((shareClass) => {
    let name;
    let amount;
    let startDate;
    let expirtyDate;

    for (const section of shareClass.sections) {
      for (const item of section.elements) {
        switch (item.key) {
          case 'shareClass_className_sl':
            name = item.data[0];
            break;
          case 'facility_facility_amount':
            amount = item.data[0];
            break;
          case 'shareClass_subscription_initialSubscription_start_date_sl':
            startDate = item.data[0];
            break;
          case 'shareClass_subscription_initialSubscription_cutoff_date_sl':
            expirtyDate = item.data[0];
            break;
          default:
            break;
        }
      }
    }

    return { name, amount, startDate, expirtyDate };
  });

  return (
    <>
      <header>
        <h2>Facilities</h2>
      </header>

      <table className="shareClassesList">
        <thead>
          <tr>
            <td>Name</td>
            <td>Amount</td>
            <td>Start date</td>
            <td>Expiry date</td>
            <td>Action</td>
          </tr>
        </thead>

        <tbody>
          {shareClassesReviewData.map(
            ({ name, amount, startDate, expirtyDate }, index) => {
              return (
                <tr key={index}>
                  <td>{name ? name : <span>Not set</span>}</td>
                  <td>{amount ? amount : <span>Not set</span>}</td>
                  <td>{startDate ? startDate : <span>Not set</span>}</td>
                  <td>{expirtyDate ? expirtyDate : <span>Not set</span>}</td>
                  <td>
                    <Button
                      label="Edit"
                      tertiary
                      size="small"
                      onClick={() =>
                        setCurrentSectionAndViewMode(index, ViewMode.edit)
                      }
                    />
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>

      {!isReviewMode && (
        <>
          <div>
            <Button
              label="Create new Facility"
              onClick={() => {
                if (shareClasses.length === 1) {
                  dispatch(
                    setAppModal(
                      appModalData({
                        title: 'New Facility',
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
                              Coming soon
                            </h2>
                            <span
                              style={{
                                marginTop: 10,
                                textAlign: 'center',
                                fontSize: 14,
                              }}
                            >
                              We are currently developing this feature. It will
                              be released soon.
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
                label="Next: Review"
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

export default AssetFacilitiesReviewForm;
