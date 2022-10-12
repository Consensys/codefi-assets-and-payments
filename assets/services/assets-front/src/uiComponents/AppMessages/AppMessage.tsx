import React, { useEffect, useState } from 'react';
import { useCallback } from 'react';
import Icon from '../Icon';

export interface IAppMessage {
  readonly action?: () => void;
  readonly actionLabel?: string;
  readonly color?: string;
  readonly duration?: number;
  readonly icon?: string;
  readonly isDark?: boolean;
  readonly message: string;
  readonly secondaryMessage?: string;
}

export interface IAppMessageInternal {
  messageKey: string;
  onClose: (keyToDelete: string) => void;
  message: IAppMessage;
}

export const appMessageData = (message: IAppMessage): IAppMessage => message;

interface IState {
  hidden: boolean;
}

const Message: React.FC<IAppMessageInternal> = ({
  message,
  messageKey,
  onClose,
}) => {
  const [state, setState] = useState<IState>({
    hidden: false,
  });

  const transitionOut = useCallback((): void => {
    setState((s) => ({
      ...s,
      hidden: true,
    }));
    setTimeout(onClose, 250);
  }, [onClose]);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      transitionOut,
      message.duration || 10 * 1000, // 10 seconds
    );
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [message.duration, transitionOut]);

  return (
    <div
      id={messageKey}
      className={`${message.isDark ? 'dark' : 'undefined'} ${
        state.hidden ? 'hidden' : ''
      }`}
    >
      {message.icon && (
        <div className="iconContainer">
          <Icon icon={message.icon} width={20} color={message.color} />
        </div>
      )}

      <div className="messagesContainer">
        <p className="main">{message.message}</p>
        {message.secondaryMessage && (
          <p className="secondary">{message.secondaryMessage}</p>
        )}
      </div>

      {message.action && message.actionLabel && (
        <button
          onClick={message.action}
          style={{ color: message.color || undefined }}
        >
          {message.actionLabel}
        </button>
      )}
    </div>
  );
};

export default Message;
