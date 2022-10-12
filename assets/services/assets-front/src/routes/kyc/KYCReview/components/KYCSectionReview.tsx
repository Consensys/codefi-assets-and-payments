import React, { useState } from 'react';
import { mdiCheckboxMarkedCircle, mdiCloseCircle, mdiDownload } from '@mdi/js';
import clsx from 'clsx';

import {
  constructCofidocsFileUrl,
  formatDate,
  downloadFromCofidocs,
  formatNumber,
} from 'utils/commonUtils';

import i18n from 'utils/i18n';
import { commonActionsTexts } from 'texts/commun/actions';

import { IKYCSection } from 'types/KYCSection';
import { IKYCSectionElement } from 'types/KYCSectionElement';

import Preview from 'uiComponents/Preview';
import Button from 'uiComponents/Button';
import Icon from 'uiComponents/Icon';

import { Link } from 'react-router-dom';
import { CLIENT_ROUTE_KYC_REVIEW } from 'routesList';
import { IKYCValidation } from '../KYCReview';
import { IKYCElementInstance } from 'types/KYCElementInstance';
import Input from 'uiComponents/Input';
import InputDate from 'uiComponents/InputDate';
import Checkbox from 'uiComponents/Checkbox';
import {
  ElementType,
  ReviewStatus,
} from 'routes/Issuer/AssetIssuance/elementsTypes';
import { colors } from 'constants/styles';
import { IUser, UserType } from 'User';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { KYCSectionReviewTexts } from 'texts/routes/kyc/KYCReview';
import { IKYCElement } from 'types/KYCElement';
import { userSelector } from 'features/user/user.store';

interface IDocumentRenewalDateProps {
  saveKYCReviews?: (validations: Array<IKYCValidation>) => void;
  element: IKYCElementInstance;
  reviewMode?: boolean;
}

/**
 * disableSelectPastDate disables the ability to pick a renewal
 * date from the past or picking the current date as a renewal date
 * because if that happens the user status will be blocked as "Verification Pending"
 * @returns the next day to start picking from as renewal day
 */
const disableSelectPastDate = (): string => {
  const today = new Date();
  const dd = String(today.getDate() + 1).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return yyyy + '-' + mm + '-' + dd;
};

const DocumentRenewalDate = ({
  reviewMode,
  element,
  saveKYCReviews,
}: IDocumentRenewalDateProps) => {
  const [renewal, setRenewal] = useState(!!element.validityDate);
  const intl = useIntl();
  return (
    <>
      {!reviewMode && (
        <>
          <Checkbox
            checked={!!element.validityDate}
            onChange={(e) => {
              setRenewal((e.target as HTMLInputElement).checked);
            }}
            label={intl.formatMessage(
              KYCSectionReviewTexts.setDocumentRenewalDate,
            )}
          />
          {renewal && (
            <InputDate
              label={intl.formatMessage(
                KYCSectionReviewTexts.documentRenewalDate,
              )}
              required={false}
              defaultValue={element.validityDate}
              className="document-renewal-date-input"
              onChange={(e) => {
                if (saveKYCReviews) {
                  saveKYCReviews([
                    {
                      reviewId: element.reviewId,
                      status: ReviewStatus.VALIDATED,
                      validityDate: new Date(
                        (e.target as HTMLInputElement).value,
                      ),
                    },
                  ]);
                }
              }}
              min={disableSelectPastDate()}
            />
          )}
        </>
      )}
      {reviewMode && !!element.validityDate && (
        <>
          {intl.formatMessage(KYCSectionReviewTexts.shouldBeRenewedOn, {
            date: formatDate(new Date(element.validityDate)),
          })}
        </>
      )}
    </>
  );
};

interface IProps {
  investorId: string;
  issuerId: string;
  section: IKYCSection;
  reviewMode?: boolean;
  isKycValidated: boolean;
  isSaving?: boolean;
  saveKYCReviews?: (reviews: Array<IKYCValidation>) => void;
}

const KYCSectionReview: React.FC<IProps> = ({
  investorId,
  issuerId,
  section,
  reviewMode,
  isKycValidated,
  saveKYCReviews,
}: IProps) => {
  const intl = useIntl();
  const user = useSelector(userSelector) as IUser;
  const actionsColor = (status: string | null, iconStatus: string): string => {
    if (status !== iconStatus) return '#777C8C';
    switch (status) {
      case ReviewStatus.VALIDATED:
        return '#008055';
      case ReviewStatus.REJECTED:
        return colors.errorDark;
      default:
        return '#777C8C';
    }
  };

  const validateRejectSubSection =
    (subSectionItems: Array<IKYCSectionElement>, status: ReviewStatus) => () =>
      saveKYCReviews &&
      saveKYCReviews(
        subSectionItems
          .filter(
            ({ element, elementInstance }) =>
              element.type !== ElementType.title && !!elementInstance,
          )
          .map(({ elementInstance }) => ({
            reviewId: elementInstance.reviewId,
            status: status,
          })),
      );

  const validateRejectSubSectionElement =
    (
      element: IKYCElementInstance,
      status: ReviewStatus,
      comment?: string,
      validityDate?: Date,
    ) =>
    () => {
      if (saveKYCReviews) {
        saveKYCReviews([
          {
            reviewId: element.reviewId,
            status,
            comment,
            validityDate,
          },
        ]);
      }
    };

  const role = user.userType;

  const sectionElementsStatus = Array.from(
    new Set(
      section.elements
        .filter(
          (kycElement) =>
            kycElement.element.type !== ElementType.title &&
            !!kycElement.elementInstance,
        )
        .map((kycElement) => {
          return kycElement.elementInstance.status;
        }),
    ),
  );

  const getTitle = (element: IKYCElement) => {
    if (element.key.startsWith('termsAndConditions')) {
      return intl.formatMessage(KYCSectionReviewTexts.termsAndConditions);
    } else if (element.key.startsWith('confirmationOfPayment')) {
      return intl.formatMessage(KYCSectionReviewTexts.payment);
    } else {
      return i18n(intl.locale, element.label);
    }
  };

  return (
    <>
      <div className="topHeader">
        <h3>{i18n(intl.locale, section.label)}</h3>
        {!reviewMode && !isKycValidated && (
          <div>
            <Button
              type="button"
              iconLeft={mdiCheckboxMarkedCircle}
              label={intl.formatMessage(commonActionsTexts.approveAll)}
              size="small"
              color={
                sectionElementsStatus.length === 1 &&
                sectionElementsStatus[0] === ReviewStatus.VALIDATED
                  ? actionsColor(ReviewStatus.VALIDATED, ReviewStatus.VALIDATED)
                  : '#ccc'
              }
              tertiary
              onClick={validateRejectSubSection(
                section.elements,
                ReviewStatus.VALIDATED,
              )}
            />
          </div>
        )}
        {reviewMode && !isKycValidated && (
          <Link
            to={CLIENT_ROUTE_KYC_REVIEW.pathBuilder({
              investorId,
              step: section.key,
            })}
            style={{
              color: colors.main,
            }}
          >
            {intl.formatMessage(commonActionsTexts.edit)}
          </Link>
        )}
      </div>

      {section.elements &&
        section.elements[0] &&
        section.elements[0].element.type !== ElementType.title && (
          <div className="header">
            <span>{intl.formatMessage(commonActionsTexts.field)}</span>
            <span>{intl.formatMessage(commonActionsTexts.value)}</span>
            <span>
              {!reviewMode && !isKycValidated
                ? intl.formatMessage(commonActionsTexts.actions)
                : ''}
            </span>
          </div>
        )}

      {section.elements
        .filter(
          ({ elementInstance, element }) =>
            !!elementInstance || element.type === ElementType.title,
        )
        .map(({ name, element, elementInstance, relatedElements }) => {
          if (element.type === ElementType.title) {
            return (
              <React.Fragment key={name}>
                <h3 key={name} className="sub-title">
                  {i18n(intl.locale, element.label)}
                </h3>
                <div className="header">
                  <span>{intl.formatMessage(commonActionsTexts.field)}</span>
                  <span>{intl.formatMessage(commonActionsTexts.value)}</span>
                  <span>
                    {!reviewMode && !isKycValidated
                      ? intl.formatMessage(commonActionsTexts.actions)
                      : ''}
                  </span>
                </div>
              </React.Fragment>
            );
          }
          return (
            <div key={name} className="field">
              <div>
                <div>
                  <span>
                    {getTitle(element)}
                    {element.type === ElementType.document &&
                    elementInstance &&
                    elementInstance.value[1] ? (
                      <>
                        <br /> <legend>{elementInstance.value[0]}</legend>
                      </>
                    ) : (
                      ''
                    )}
                  </span>

                  <span>
                    {!element.key.startsWith('onfido_onfido') &&
                      elementInstance && (
                        <>
                          {(() => {
                            switch (element.type) {
                              case ElementType.string:
                                return elementInstance.value[0];
                              case ElementType.number:
                                return formatNumber(
                                  parseFloat(elementInstance.value[0]),
                                );
                              case ElementType.date:
                                return formatDate(
                                  new Date(elementInstance.value[0]),
                                );
                              default:
                                return '';
                            }
                          })()}
                        </>
                      )}
                    {(() => {
                      if (
                        element.key.startsWith('onfido_onfido') &&
                        elementInstance
                      ) {
                        const checkId = elementInstance.data.checkId;
                        return (
                          <span>
                            {' '}
                            <Link
                              to={{
                                pathname: `https://dashboard.onfido.com/checks/${checkId}/reports`,
                              }}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {intl.formatMessage(
                                KYCSectionReviewTexts.viewIdentity,
                              )}
                            </Link>
                          </span>
                        );
                      } else {
                        return <span> </span>;
                      }
                    })()}
                    {(() => {
                      if (element.key.startsWith('termsAndConditions')) {
                        return (
                          <span>
                            {intl.formatMessage(KYCSectionReviewTexts.agreed)}
                          </span>
                        );
                      }
                    })()}
                    {(() => {
                      if (element.key.startsWith('confirmationOfPayment')) {
                        return (
                          <span>
                            {intl.formatMessage(
                              KYCSectionReviewTexts.paymentCompleted,
                            )}
                          </span>
                        );
                      }
                    })()}
                    {element.type === ElementType.multistring && elementInstance
                      ? elementInstance.value[0]
                      : ''}
                    {element.type === ElementType.document &&
                    elementInstance &&
                    elementInstance.value[1] ? (
                      <>
                        <Preview
                          label={intl.formatMessage(commonActionsTexts.preview)}
                          url={constructCofidocsFileUrl(
                            elementInstance.value[1],
                            role === UserType.VERIFIER ? investorId : undefined,
                            role === UserType.VERIFIER ? issuerId : undefined,
                          )}
                          filename={elementInstance.value[0]}
                          showIconLeft
                        />
                        <Button
                          size="small"
                          iconLeft={mdiDownload}
                          label={intl.formatMessage(
                            commonActionsTexts.download,
                          )}
                          tertiary
                          onClick={() => {
                            downloadFromCofidocs(
                              elementInstance.value[0],
                              elementInstance.value[1],
                            );
                          }}
                        />
                      </>
                    ) : (
                      ''
                    )}
                    {element.key === ElementType.check &&
                    elementInstance &&
                    elementInstance.value.length > 0 &&
                    !element.key.startsWith('termsAndConditions') &&
                    !element.key.startsWith('confirmationOfPayment') ? (
                      <ul>
                        {elementInstance.value.sort().map((index) => (
                          <li key={index}>
                            {i18n(
                              intl.locale,
                              element.inputs[parseInt(index)].label,
                            )}
                            {element.key.indexOf(
                              'sourceOfKnowledge_riskProfile',
                            ) > -1 &&
                            index === '3' &&
                            relatedElements?.length > 0
                              ? `: ${relatedElements[0].elementInstance.value[0]}`
                              : ''}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      ''
                    )}
                    {element.type === ElementType.radio &&
                    elementInstance &&
                    elementInstance.value.length > 0
                      ? i18n(
                          intl.locale,
                          element.inputs[parseInt(elementInstance.value[0])]
                            .label,
                        )
                      : ''}
                  </span>
                </div>
                <div
                  className={clsx({
                    review: reviewMode || isKycValidated,
                  })}
                >
                  {!reviewMode && !isKycValidated && (
                    <>
                      <button
                        type="button"
                        disabled={
                          !elementInstance || elementInstance.value.length === 0
                        }
                        onClick={validateRejectSubSectionElement(
                          elementInstance,
                          ReviewStatus.VALIDATED,
                        )}
                      >
                        <Icon
                          icon={mdiCheckboxMarkedCircle}
                          color={actionsColor(
                            (elementInstance || {}).status,
                            ReviewStatus.VALIDATED,
                          )}
                        />
                      </button>

                      <button
                        type="button"
                        disabled={
                          !elementInstance || elementInstance.value.length === 0
                        }
                        onClick={validateRejectSubSectionElement(
                          elementInstance,
                          ReviewStatus.REJECTED,
                        )}
                      >
                        <Icon
                          icon={mdiCloseCircle}
                          color={actionsColor(
                            (elementInstance || {}).status,
                            ReviewStatus.REJECTED,
                          )}
                        />
                      </button>
                    </>
                  )}
                  {(reviewMode || isKycValidated) && (
                    <Icon
                      icon={
                        (elementInstance || {}).status ===
                        ReviewStatus.VALIDATED
                          ? mdiCheckboxMarkedCircle
                          : mdiCloseCircle
                      }
                      color={actionsColor(
                        (elementInstance || {}).status,
                        (elementInstance || {}).status,
                      )}
                    />
                  )}
                </div>
              </div>
              {!isKycValidated && (
                <div
                  className={clsx({
                    rejected:
                      (elementInstance || {}).status === ReviewStatus.REJECTED,
                  })}
                >
                  {(elementInstance || {}).status === ReviewStatus.REJECTED && (
                    <Input
                      name={name}
                      label={intl.formatMessage(
                        KYCSectionReviewTexts.provideReason,
                      )}
                      placeholder=""
                      required
                      defaultValue={elementInstance.comment || ''}
                      onBlur={(_, value: string | undefined) => {
                        if (
                          (value || '').length > 0 &&
                          value !== elementInstance.comment
                        ) {
                          validateRejectSubSectionElement(
                            elementInstance,
                            ReviewStatus.REJECTED,
                            value,
                          )();
                        }
                      }}
                      disabled={reviewMode}
                    />
                  )}
                  {(elementInstance || {}).status === ReviewStatus.VALIDATED &&
                    element.type === ElementType.document && (
                      <DocumentRenewalDate
                        element={elementInstance}
                        saveKYCReviews={saveKYCReviews}
                        reviewMode={reviewMode}
                      />
                    )}
                </div>
              )}
            </div>
          );
        })}
    </>
  );
};

export default KYCSectionReview;
