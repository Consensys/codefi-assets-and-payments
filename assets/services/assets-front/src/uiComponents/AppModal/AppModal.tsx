import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

import Button from '../Button';
import Icon from 'uiComponents/Icon';
import i18n from 'utils/i18n';
import { appModalTexts } from 'texts/components/appModal';
import { mdiClose } from '@mdi/js';
import { colors } from 'constants/styles';

import './AppModalStyles.scss';
import { useIntl } from 'react-intl';
import { appModalDataSelector } from 'features/user/user.store';
import { useSelector } from 'react-redux';
import { EventEmitter, Events } from 'features/events/EventEmitter';
import { useCallback } from 'react';

export interface IAppModalData {
  readonly title?: string;
  readonly content?: React.ReactNode;
  readonly isSimpleAcknowledgement?: boolean;
  readonly acknowledgementLabel?: string | { [key: string]: string };
  readonly acknowledgementAction?: () => void;
  readonly cancelAction?: () => void;
  readonly cancelLabel?: string | { [key: string]: string };
  readonly cancelColor?: string;
  readonly confirmAction?: (e: { [key: string]: HTMLInputElement }) => void;
  readonly confirmLabel?: string | { [key: string]: string };
  readonly confirmColor?: string;
  readonly noPadding?: boolean;
  readonly closeIcon?: boolean;
  readonly htmlTag?: 'div' | 'form';
}

export const appModalData = (message: IAppModalData): IAppModalData => message;

const AppModal: React.FC = () => {
  const [modalData, setModalData] = useState<IAppModalData | undefined>(
    undefined,
  );
  const [hidden, setHidden] = useState<boolean>(true);
  const intl = useIntl();
  const storeAppModalData = useSelector(appModalDataSelector);

  const onCancel = useCallback(() => {
    modalData?.cancelAction && modalData.cancelAction();
    selfClose();
  }, [modalData]);

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.keyCode === 27) {
      onCancel();
    }
  };

  useEffect(() => {
    setModal(storeAppModalData);
    document.addEventListener('keydown', onKeydown);
    EventEmitter.subscribe(Events.EVENT_CLOSE_MODAL, selfClose);
    return () => {
      document.removeEventListener('keydown', onKeydown);
      EventEmitter.unsubscribe(Events.EVENT_CLOSE_MODAL);
    };
    // eslint-disable-next-line
  }, [storeAppModalData]);

  const setModal = (data: IAppModalData | undefined): void => {
    setModalData(data);
    setHidden(false);
  };

  const selfClose = (): void => {
    setHidden(true);

    setTimeout(() => setModalData(undefined), 200);
  };

  const onAcknowledge = () => {
    modalData?.acknowledgementAction && modalData.acknowledgementAction();
    selfClose();
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const htmlElements: { [key: string]: HTMLInputElement } = e.currentTarget
      .elements as unknown as {
      [key: string]: HTMLInputElement;
    };
    modalData?.confirmAction && modalData.confirmAction(htmlElements);
    selfClose();
  };

  const getLabel = (
    label: string | undefined | { [key: string]: string },
    defaultLabel: string,
  ): string =>
    label
      ? typeof label === 'string'
        ? label
        : i18n(intl.locale, label as { [key: string]: string })
      : defaultLabel;

  if (!modalData) {
    return <React.Fragment />;
  }

  const type: 'div' | 'form' =
    modalData.htmlTag || (modalData.confirmAction ? 'form' : 'div');
  let props: any = {
    className: clsx('_uiComponent_appModal', { hidden }),
  };
  if (type === 'form') {
    props = {
      ...props,
      onSubmit,
    };
  }

  return React.createElement(
    type,
    props,
    <>
      <figure onClick={onCancel} />

      <div>
        {modalData.title && (
          <div className="modal-header">
            <h2>{modalData.title}</h2>
            {modalData.closeIcon && (
              <button onClick={onCancel}>
                <Icon icon={mdiClose} />
              </button>
            )}
          </div>
        )}
        {modalData.content && (
          <div
            className={clsx('content', {
              noPadding: modalData.noPadding,
            })}
          >
            {modalData.content}
          </div>
        )}

        {modalData.isSimpleAcknowledgement && (
          <footer>
            <Button
              label={getLabel(
                modalData.acknowledgementLabel,
                intl.formatMessage(appModalTexts.defaultAcknowledgementLabel),
              )}
              onClick={onAcknowledge}
            />
          </footer>
        )}
        {modalData.confirmAction && (
          <footer>
            <Button
              tertiary
              color={modalData.cancelColor || '#1A2233'}
              label={getLabel(
                modalData.cancelLabel,
                intl.formatMessage(appModalTexts.defaultCancelLabel),
              )}
              onClick={onCancel}
            />
            <Button
              type="submit"
              color={modalData.confirmColor || colors.main}
              label={getLabel(
                modalData.confirmLabel,
                intl.formatMessage(appModalTexts.defaultConfirmLabel),
              )}
            />
          </footer>
        )}
      </div>
    </>,
  );
};

export default AppModal;
