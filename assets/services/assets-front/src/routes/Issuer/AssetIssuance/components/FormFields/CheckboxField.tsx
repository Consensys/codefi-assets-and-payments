import React, { FC } from 'react';
import clsx from 'clsx';
import CSS from 'csstype';
import { useIntl } from 'react-intl';

import { IUser } from 'User';
import InputGroup from 'uiComponents/InputGroup/InputGroup';
import Checkbox from 'uiComponents/Checkbox';
import i18n from 'utils/i18n';
import { IIssuanceElement } from '../../insuanceDataType';
import { ElementStatus } from '../../elementsTypes';
import FormField from '../FormField';

interface IProps {
  element: IIssuanceElement;
  elements: Array<IIssuanceElement>;
  reviewMode: boolean;
  users: Array<IUser>;
  style?: CSS.Properties;
  onUpdateData: (key: string, value: string[]) => Promise<void>;
}

export const CheckboxField: FC<IProps> = ({
  element,
  elements,
  reviewMode,
  users,
  style,
  onUpdateData,
}: IProps) => {
  const intl = useIntl();
  return (
    <div
      className={clsx('_route_issuer_assetIssuance_formField', {
        [`size_${element.size}`]: element.size,
        fillLine: element.fillLine,
      })}
      style={style}
    >
      <InputGroup
        title={i18n(intl.locale, element.label)}
        subTitle={
          element.sublabel ? i18n(intl.locale, element.sublabel) : undefined
        }
      >
        {element.inputs &&
          element.inputs.map((input, index, allInputs) => {
            const checked = (element.data || []).includes(allInputs[index].key);
            if (reviewMode) {
              if (checked) {
                return (
                  <React.Fragment key={i18n(intl.locale, input.label)}>
                    <span key={i18n(intl.locale, input.label)}>
                      {i18n(intl.locale, input.label)}
                    </span>
                    {(input.relatedElements || []).map(
                      (relatedElementKey, idx) => {
                        const conditionalElements = elements.filter(
                          (e) =>
                            e.status === ElementStatus.conditionalOptional ||
                            e.status === ElementStatus.conditionalMandatory,
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
              <React.Fragment key={i18n(intl.locale, input.label)}>
                <Checkbox
                  name={element.name}
                  label={i18n(intl.locale, input.label)}
                  checked={checked}
                  required={
                    (element.status === ElementStatus.mandatory ||
                      element.status === ElementStatus.conditionalMandatory) &&
                    (element.data || []).length === 0 &&
                    allInputs.length > 1
                  }
                  onChange={(e: React.FormEvent<HTMLInputElement>) => {
                    if ((e.target as HTMLInputElement).checked) {
                      onUpdateData(element.key, [
                        allInputs[index].key,
                        ...(element.data || []),
                      ]);
                    } else {
                      onUpdateData(
                        element.key,
                        [...(element.data || [])].filter(
                          (v: string) => v !== allInputs[index].key,
                        ),
                      );
                    }
                  }}
                />
                {checked &&
                  (input.relatedElements || []).map((relatedElementKey) => {
                    const conditionalElements = elements.filter(
                      (e) =>
                        e.status === ElementStatus.conditionalOptional ||
                        e.status === ElementStatus.conditionalMandatory,
                    );
                    const matchedRelatedElement = conditionalElements.find(
                      (e) => e.key === relatedElementKey,
                    );
                    if (!matchedRelatedElement) {
                      return null;
                    }
                    return (
                      <FormField
                        elements={elements}
                        users={users}
                        key={relatedElementKey}
                        element={matchedRelatedElement}
                        reviewMode={reviewMode}
                        onUpdateData={onUpdateData}
                      />
                    );
                  })}
              </React.Fragment>
            );
          })}
      </InputGroup>
    </div>
  );
};
