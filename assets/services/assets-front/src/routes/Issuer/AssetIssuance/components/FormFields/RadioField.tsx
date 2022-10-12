import React, { FC } from 'react';
import clsx from 'clsx';
import CSS from 'csstype';
import { useIntl } from 'react-intl';

import { IUser } from 'User';
import i18n from 'utils/i18n';
import { colors } from 'constants/styles';
import Radio from 'uiComponents/Radio';
import InputGroup from 'uiComponents/InputGroup/InputGroup';
import { IIssuanceElement } from '../../insuanceDataType';
import { ElementStatus } from '../../elementsTypes';
import FormField from '../FormField';

interface IProps {
  element: IIssuanceElement;
  elements: Array<IIssuanceElement>;
  reviewMode: boolean;
  style?: CSS.Properties;
  users: Array<IUser>;
  onUpdateData: (key: string, value: string[]) => Promise<void>;
}
export const RadioField: FC<IProps> = ({
  element,
  elements,
  reviewMode,
  style,
  users,
  onUpdateData,
}: IProps) => {
  const intl = useIntl();
  return (
    <>
      <div
        className={clsx('_route_issuer_assetIssuance_formField', {
          [`size_${element.size}`]: element.size,
          fillLine: element.fillLine,
        })}
        style={style}
      >
        <InputGroup
          title={i18n(intl.locale, element.label)}
          required={
            element.status === ElementStatus.mandatory ||
            element.status === ElementStatus.conditionalMandatory
          }
          subTitle={
            element.sublabel ? i18n(intl.locale, element.sublabel) : undefined
          }
        >
          {(element.inputs || []).map((input, index, allInputs) => {
            const checked = (element.data || []).includes(allInputs[index].key);
            if (reviewMode) {
              if (checked) {
                return (
                  <React.Fragment key={input.key}>
                    <span key={i18n(intl.locale, input.label)}>
                      {i18n(intl.locale, input.label)}
                    </span>
                    {(input.relatedElements || []).map(
                      (relatedElementKey, idx) => {
                        const conditionalElements = elements.filter(
                          (e) =>
                            e.status === ElementStatus.conditionalMandatory ||
                            e.status === ElementStatus.conditionalOptional,
                        );
                        const matchedRelatedElement = conditionalElements.find(
                          (e) => e.key === relatedElementKey,
                        );
                        if (!matchedRelatedElement) {
                          return null;
                        }
                        return (
                          <FormField
                            element={matchedRelatedElement}
                            elements={elements}
                            users={users}
                            key={relatedElementKey}
                            onUpdateData={onUpdateData}
                            reviewMode
                            style={
                              idx === 0 ? { marginTop: '24px' } : undefined
                            }
                          />
                        );
                      },
                    )}
                  </React.Fragment>
                );
              }
              return null;
            }
            return (
              <React.Fragment key={input.key}>
                <Radio
                  label={i18n(intl.locale, input.label)}
                  name={element.name}
                  required={
                    element.status === ElementStatus.mandatory ||
                    element.status === ElementStatus.conditionalMandatory
                  }
                  checked={checked}
                  onChange={() => {
                    onUpdateData(element.key, [allInputs[index].key]);
                  }}
                />
                {element.fillLine &&
                  checked &&
                  (input.relatedElements || []).map((relatedElementKey) => {
                    const conditionalElements = elements.filter(
                      (e) =>
                        e.status === ElementStatus.conditionalMandatory ||
                        e.status === ElementStatus.conditionalOptional,
                    );
                    const matchedRelatedElement = conditionalElements.find(
                      (e) => e.key === relatedElementKey,
                    );
                    if (!matchedRelatedElement) {
                      return null;
                    }
                    return (
                      <FormField
                        element={matchedRelatedElement}
                        elements={elements}
                        key={relatedElementKey}
                        users={users}
                        reviewMode={reviewMode}
                        onUpdateData={onUpdateData}
                        style={{
                          marginLeft: '6px',
                          borderLeft: `2px solid ${colors.main}`,
                          paddingLeft: '10px',
                        }}
                      />
                    );
                  })}
              </React.Fragment>
            );
          })}
        </InputGroup>
      </div>
      {!element.fillLine && (
        <>
          {(element.inputs || []).map((input, index, allInputs) => {
            const checked = (element.data || []).includes(allInputs[index].key);

            return (
              checked && (
                <React.Fragment key={`${input.key}-children`}>
                  {(input.relatedElements || []).map((relatedElementKey) => {
                    const conditionalElements = elements.filter(
                      (e) =>
                        e.status === ElementStatus.conditionalMandatory ||
                        e.status === ElementStatus.conditionalOptional,
                    );
                    const matchedRelatedElement = conditionalElements.find(
                      (e) => e.key === relatedElementKey,
                    );
                    if (!matchedRelatedElement) {
                      return null;
                    }
                    return (
                      <FormField
                        element={matchedRelatedElement}
                        elements={elements}
                        users={users}
                        reviewMode={reviewMode}
                        key={relatedElementKey}
                        onUpdateData={onUpdateData}
                      />
                    );
                  })}
                </React.Fragment>
              )
            );
          })}
        </>
      )}
    </>
  );
};
