import React, { FormEvent } from 'react';
import { mdiAlert } from '@mdi/js';

import i18n from 'utils/i18n';

import Input, { InputType } from 'uiComponents/Input';
import Select from 'uiComponents/Select';
import Checkbox from 'uiComponents/Checkbox';
import InputFile from 'uiComponents/InputFile';
import Radio from 'uiComponents/Radio';

import InputGroup from 'uiComponents/InputGroup/InputGroup';
import Icon from 'uiComponents/Icon';
import { colors, spacing } from 'constants/styles';
import {
  ElementType,
  ReviewStatus,
  ElementStatus,
} from 'routes/Issuer/AssetIssuance/elementsTypes';
import { IKYCSectionElement } from 'types/KYCSectionElement';
import { KYCOnfido } from './KYCOnfido';
import { debounce } from 'lodash';
import { useIntl } from 'react-intl';
import { KYCElementTexts } from 'texts/routes/kyc/KYCSubmit';
import { Link } from 'react-router-dom';

const isDocumentExpired = (validityDate: Date): boolean => {
  if (validityDate) {
    return new Date().getTime() > new Date(validityDate).getTime();
  }
  return false;
};

const isValidUkPostcode = (postcode: string): boolean => {
  postcode = postcode.replace(/\s/g, '');
  const regex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]{0,1} ?[0-9][A-Z]{2}$/i;
  return regex.test(postcode);
};

const isValidEmail = (email: string): boolean => {
  const re =
    /^([a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)/;
  return re.test(email);
};

interface IProps {
  reviewMode?: boolean;
  item: IKYCSectionElement;
  allSectionItems: Array<IKYCSectionElement>;
  isLoading?: boolean;
  saveElement?: (name: string, values: Array<string>) => void;
  templateName: string;
  hideLabel?: boolean;
}

const KYCElement: React.FC<IProps> = ({
  item,
  allSectionItems,
  reviewMode,
  saveElement,
  isLoading,
  templateName,
  hideLabel,
}: IProps) => {
  const { name, element, elementInstance, relatedElements } = item;
  const intl = useIntl();
  if (
    element.key.indexOf('onfido') > -1 &&
    element.type !== ElementType.title
  ) {
    if (reviewMode) {
      return (
        <div>{intl.formatMessage(KYCElementTexts.documentsSubmitted)}</div>
      );
    }
    if ((elementInstance || {}).status === ReviewStatus.VALIDATED) {
      return (
        <div>{intl.formatMessage(KYCElementTexts.documentsValidated)}</div>
      );
    }
    return (
      <KYCOnfido
        item={item}
        saveElement={saveElement}
        templateName={templateName}
      />
    );
  }
  if (reviewMode && element.key.indexOf('termsAndConditions') > -1) {
    return <div>{intl.formatMessage(KYCElementTexts.agreedToTerms)}</div>;
  }
  if (reviewMode && element.key.indexOf('confirmationOfPayment') > -1) {
    return <div>{intl.formatMessage(KYCElementTexts.paymentPerformed)}</div>;
  }
  return (
    <>
      {ElementType.title === element.type && !reviewMode && (
        <>
          <div className="subSectionHeader">
            <h2>{i18n(intl.locale, element.label)}</h2>
          </div>
          {element.placeholder && (
            <span style={{ fontSize: 14 }}>
              {i18n(
                intl.locale,
                element.placeholder as { [key: string]: string },
              )}
            </span>
          )}
        </>
      )}
      <div>
        {ElementType.number === element.type && (
          <Input
            style={{ marginBottom: spacing.small }}
            name={name}
            label={i18n(intl.locale, element.label)}
            type="number"
            onChange={debounce((_event, value) => {
              saveElement && saveElement(name, value ? [value] : []);
            }, 500)}
            placeholder={
              element.placeholder
                ? i18n(
                    intl.locale,
                    element.placeholder as {
                      [key: string]: string;
                    },
                  )
                : ''
            }
            defaultValue={((elementInstance || {}).value || [])[0]}
            required={
              element.status === ElementStatus.conditional
                ? (element.data.validation || {}).status ===
                  ElementStatus.mandatory
                : element.status === ElementStatus.mandatory
            }
            warning={
              (elementInstance || {}).status === ReviewStatus.REJECTED ? (
                <>
                  <b style={{ marginRight: 5 }}>
                    {intl.formatMessage(
                      KYCElementTexts.informationUpdateRequired,
                    )}
                  </b>
                  {(elementInstance || {}).comment}
                </>
              ) : null
            }
            readOnly={reviewMode}
            disabled={(elementInstance || {}).status === ReviewStatus.VALIDATED}
          />
        )}
        {(ElementType.string === element.type ||
          ElementType.date === element.type) && (
          <Input
            style={{ marginBottom: spacing.small }}
            name={name}
            label={hideLabel ? '' : i18n(intl.locale, element.label)}
            type={
              element.type === ElementType.string
                ? element.data.validation && element.data.validation.isEmail
                  ? 'email'
                  : 'text'
                : (element.type as InputType)
            }
            placeholder={
              element.placeholder
                ? i18n(
                    intl.locale,
                    element.placeholder as {
                      [key: string]: string;
                    },
                  )
                : ''
            }
            defaultValue={((elementInstance || {}).value || [])[0]}
            required={
              element.status === ElementStatus.conditional
                ? (element.data.validation || {}).status ===
                  ElementStatus.mandatory
                : element.status === ElementStatus.mandatory
            }
            warning={(() => {
              if (
                name.indexOf('postalCode') > -1 &&
                relatedElements?.length > 0 &&
                relatedElements[0].elementInstance?.value[0] === 'GBR' &&
                !isValidUkPostcode((elementInstance || {}).value[0])
              ) {
                return (
                  <div>
                    {intl.formatMessage(KYCElementTexts.postcodeUKInvalid)}
                  </div>
                );
              } else if (
                name.toLowerCase().indexOf('email') > -1 &&
                (elementInstance || {}).value?.length > 0 &&
                !isValidEmail((elementInstance || {}).value[0])
              ) {
                return (
                  <div>
                    {intl.formatMessage(KYCElementTexts.emailValidationError)}
                  </div>
                );
              } else if (
                (elementInstance || {}).status === ReviewStatus.REJECTED
              ) {
                return (
                  <>
                    <b style={{ marginRight: 5 }}>
                      {intl.formatMessage(
                        KYCElementTexts.informationUpdateRequired,
                      )}
                    </b>
                    {(elementInstance || {}).comment}
                  </>
                );
              } else {
                return null;
              }
            })()}
            readOnly={reviewMode}
            onChange={debounce((_event, value) => {
              saveElement && saveElement(name, value ? [value] : []);
            }, 500)}
            disabled={(elementInstance || {}).status === ReviewStatus.VALIDATED}
          />
        )}
        {element.type === ElementType.multistring && (
          <Select
            label={i18n(intl.locale, element.label)}
            options={element.inputs.map((input) => ({
              label: i18n(intl.locale, input.label),
              value: input.value || i18n(intl.locale, input.label),
            }))}
            placeholder=" "
            warning={
              (elementInstance || {}).status === ReviewStatus.REJECTED ? (
                <>
                  <b style={{ marginRight: 5 }}>
                    {intl.formatMessage(
                      KYCElementTexts.informationUpdateRequired,
                    )}
                  </b>
                  {(elementInstance || {}).comment}
                </>
              ) : null
            }
            required={
              element.status === ElementStatus.conditional
                ? element.data.validation.status === ElementStatus.mandatory
                : element.status === ElementStatus.mandatory
            }
            defaultValue={((elementInstance || {}).value || [])[0]}
            onChange={(value) => saveElement && saveElement(name, [value])}
            disabled={(elementInstance || {}).status === ReviewStatus.VALIDATED}
            readOnly={reviewMode}
          />
        )}
        {relatedElements?.length > 0 &&
          relatedElements[0].name.indexOf('us_state') > -1 && (
            <KYCElement
              item={relatedElements[0]}
              reviewMode={reviewMode}
              saveElement={saveElement}
              isLoading={isLoading}
              templateName={templateName}
              allSectionItems={allSectionItems}
            />
          )}
        {element.type === ElementType.document && (
          <>
            <InputFile
              name={name}
              label={i18n(intl.locale, element.label)}
              required={
                element.status === ElementStatus.conditional
                  ? (element.data.validation || {}).status ===
                    ElementStatus.mandatory
                  : element.status === ElementStatus.mandatory
              }
              disabled={
                reviewMode ||
                ((elementInstance || {}).status === ReviewStatus.VALIDATED &&
                  !isDocumentExpired(
                    (elementInstance || {}).validityDate as Date,
                  ))
              }
              value={(elementInstance || {}).value}
              isLoading={isLoading}
              onChange={async (newValue) => {
                try {
                  saveElement && (await saveElement(name, newValue));
                } catch (err) {
                  saveElement && (await saveElement(name, []));
                }
              }}
            />
            {(elementInstance || {}).status === ReviewStatus.VALIDATED &&
              isDocumentExpired(
                (elementInstance || {}).validityDate as Date,
              ) && (
                <div className="error">
                  <Icon icon={mdiAlert} width={16} color={colors.warningDark} />{' '}
                  {intl.formatMessage(KYCElementTexts.documentExpired)}
                </div>
              )}
          </>
        )}
        {element.key.indexOf('confirmationOfPayment') > -1 && (
          <div
            dangerouslySetInnerHTML={{
              __html: (element.data as any).customHtml,
            }}
          />
        )}
        {element.type === ElementType.check && (
          <>
            <InputGroup
              required={
                element.status === ElementStatus.conditional
                  ? element.data.validation.status === ElementStatus.mandatory
                  : element.status === ElementStatus.mandatory
              }
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      marginRight: '5px',
                      marginBottom: '3px',
                    }}
                  >
                    {i18n(intl.locale, element.label)}
                  </span>
                  {element.key.indexOf('termsAndConditions') > -1 && (
                    <>
                      {element.data?.signatureLink ? (
                        <Link
                          to={{
                            pathname: element.data.signatureLink,
                          }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {intl.formatMessage(KYCElementTexts.terms)}
                        </Link>
                      ) : (
                        <InputFile
                          name={name}
                          style={{
                            marginBottom: -6,
                          }}
                          disabled
                          value={[
                            intl.formatMessage(KYCElementTexts.terms),
                            element.data.docId as string,
                          ]}
                        />
                      )}
                    </>
                  )}
                </div>
              }
              subTitle={
                element.placeholder
                  ? i18n(
                      intl.locale,
                      element.placeholder as {
                        [key: string]: string;
                      },
                    )
                  : ''
              }
            >
              {element.inputs.map((input, index) => {
                const checked = ((elementInstance || {}).value || []).includes(
                  `${index}`,
                );
                if (reviewMode) {
                  return null;
                }
                return (
                  <Checkbox
                    key={i18n(intl.locale, input.label)}
                    name={name}
                    checked={checked}
                    required={
                      (element.status === ElementStatus.conditional
                        ? element.data.validation.status ===
                          ElementStatus.mandatory
                        : element.status === ElementStatus.mandatory) &&
                      ((elementInstance || {}).value || []).length === 0
                    }
                    onChange={(e: FormEvent<HTMLInputElement>) => {
                      if (saveElement) {
                        if ((e.target as HTMLInputElement).checked) {
                          saveElement(name, [
                            ...((elementInstance || {}).value || []),
                            `${index}`,
                          ]);
                        } else {
                          saveElement(name, [
                            ...((elementInstance || {}).value || []).filter(
                              (v: string) => v !== `${index}`,
                            ),
                          ]);
                        }
                      }
                    }}
                    label={i18n(intl.locale, input.label)}
                    disabled={
                      (elementInstance || {}).status === ReviewStatus.VALIDATED
                    }
                  />
                );
              })}
              {element.key.indexOf('sourceOfKnowledge_riskProfile') > -1 &&
                elementInstance?.value.includes('3') &&
                relatedElements?.length > 0 && (
                  <KYCElement
                    item={relatedElements[0]}
                    reviewMode={reviewMode}
                    saveElement={saveElement}
                    isLoading={isLoading}
                    templateName={templateName}
                    allSectionItems={allSectionItems}
                    hideLabel={true}
                  />
                )}
            </InputGroup>
            {element.inputs.map((input, index) => {
              const checked =
                parseInt(((elementInstance || {}).value || [])[0]) === index;
              return (
                <React.Fragment key={i18n(intl.locale, input.label)}>
                  {checked && reviewMode && (
                    <span key={i18n(intl.locale, input.label)}>
                      {i18n(intl.locale, input.label)}
                    </span>
                  )}
                  {checked &&
                    (input.relatedElements || []).map((targetElementKey) => {
                      const matchedElement = allSectionItems.find(
                        (relatedElement) =>
                          relatedElement.name === targetElementKey,
                      );
                      if (!matchedElement) {
                        return null;
                      }
                      return (
                        <div
                          key={`${i18n(intl.locale, input.label)}-check`}
                          style={{ marginTop: spacing.tightLooser }}
                        >
                          <KYCElement
                            key={targetElementKey}
                            item={matchedElement}
                            saveElement={saveElement}
                            reviewMode={reviewMode}
                            isLoading={isLoading}
                            allSectionItems={allSectionItems}
                            templateName={templateName}
                          />
                        </div>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </>
        )}
        {element.type === ElementType.radio && (
          <>
            <InputGroup
              title={i18n(intl.locale, element.label)}
              required={
                element.status === ElementStatus.conditional
                  ? element.data.validation.status === ElementStatus.mandatory
                  : element.status === ElementStatus.mandatory
              }
              subTitle={
                element.placeholder
                  ? i18n(
                      intl.locale,
                      element.placeholder as {
                        [key: string]: string;
                      },
                    )
                  : ''
              }
            >
              {element.inputs.map((input, index) => {
                const checked =
                  parseInt(((elementInstance || {}).value || [])[0]) === index;
                if (reviewMode) {
                  return null;
                }
                return (
                  <React.Fragment key={i18n(intl.locale, input.label)}>
                    <Radio
                      name={name}
                      value={i18n(intl.locale, input.label)}
                      required={
                        element.status === ElementStatus.conditional
                          ? element.data.validation.status ===
                            ElementStatus.mandatory
                          : element.status === ElementStatus.mandatory
                      }
                      checked={checked}
                      onChange={() =>
                        saveElement && saveElement(name, [`${index}`])
                      }
                      label={i18n(intl.locale, input.label)}
                      disabled={
                        (elementInstance || {}).status ===
                        ReviewStatus.VALIDATED
                      }
                    />
                  </React.Fragment>
                );
              })}
            </InputGroup>

            {element.inputs.map((input, index) => {
              const checked =
                parseInt(((elementInstance || {}).value || [])[0]) === index;
              return (
                <React.Fragment key={i18n(intl.locale, input.label)}>
                  {reviewMode && checked && (
                    <span key={i18n(intl.locale, input.label)}>
                      {i18n(intl.locale, input.label)}
                    </span>
                  )}
                  {checked &&
                    (input.relatedElements || []).map((targetElementKey) => {
                      const matchedElement = allSectionItems.find(
                        (relatedElement) =>
                          relatedElement.name === targetElementKey,
                      );
                      if (!matchedElement) {
                        return null;
                      }
                      return (
                        <div
                          key={`${i18n(intl.locale, input.label)}-radio`}
                          style={{ marginTop: spacing.tightLooser }}
                        >
                          <KYCElement
                            key={targetElementKey}
                            item={matchedElement}
                            saveElement={saveElement}
                            reviewMode={reviewMode}
                            isLoading={isLoading}
                            allSectionItems={allSectionItems}
                            templateName={templateName}
                          />
                        </div>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </>
        )}
        {(elementInstance || {}).status === ReviewStatus.REJECTED &&
          [
            ElementType.multistring,
            ElementType.string,
            ElementType.number,
            ElementType.date,
          ].indexOf(element.type) === -1 && (
            <div className="error">
              <Icon icon={mdiAlert} width={16} color={colors.warningDark} />{' '}
              {intl.formatMessage(KYCElementTexts.informationUpdateRequired)}
              <span>{(elementInstance || {}).comment}</span>
            </div>
          )}
      </div>
    </>
  );
};

export default KYCElement;
