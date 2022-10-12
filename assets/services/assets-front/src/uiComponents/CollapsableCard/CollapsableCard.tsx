import React, { PropsWithChildren, ReactElement } from 'react';
import './CollapsableCard.scss';
import Button from '../Button';
import { mdiPencil } from '@mdi/js';

interface IProps {
  className: string;
  header: string;
  isCollapsed: boolean;
  collapsedContent?: ReactElement;
  saveButtonLabel: string;
  editButtonLabel?: string;
  saveButtonTestId?: string;
  hideButton?: boolean;
  onSave: () => void;
  onEdit: () => void;
  onBlur?: () => void;
}

export const CollapsableCard: React.FC<PropsWithChildren<IProps>> = (
  props: PropsWithChildren<IProps>,
) => {
  return (
    <div
      className={`_uiComponent_collapsable-card ${props.className}`}
      onBlur={props.onBlur}
    >
      <div className={'collapsable-card__header'}>
        {props.header}
        {props.hideButton !== true && (
          <Button
            data-test-id={props.saveButtonTestId}
            size={'big'}
            tertiary
            iconLeft={
              props.isCollapsed ? props.editButtonLabel || mdiPencil : undefined
            }
            onClick={props.isCollapsed ? props.onEdit : props.onSave}
          >
            {props.isCollapsed ? '' : props.saveButtonLabel}
          </Button>
        )}
      </div>
      <div className={'collapsable-card__body'}>
        {props.isCollapsed && props.collapsedContent
          ? props.collapsedContent
          : props.children}
      </div>
    </div>
  );
};
