import React from 'react';

import AppMessage, { IAppMessage, IAppMessageInternal } from './AppMessage';
import './appMessagesStyles.scss';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IState {
  messages: Array<IAppMessageInternal>;
}

export default class AppMessages extends React.Component<
  Record<string, unknown>,
  IState
> {
  private messageIndex = 0;

  public state = {
    messages: [],
  };

  public componentDidMount(): void {
    EventEmitter.subscribe(Events.EVENT_APP_MESSAGE, this.addMessage);
  }

  private addMessage = (message: IAppMessage) => {
    this.messageIndex++;
    const messageKey = `message-${this.messageIndex}`;

    this.setState({
      messages: [
        ...(this.state.messages as Array<IAppMessageInternal>),
        {
          message,
          onClose: () => this.deleteMessage(messageKey),
          messageKey,
        },
      ],
    });
  };

  private deleteMessage = (keyToDelete: string) => {
    this.setState({
      messages: this.state.messages.filter(
        (message: IAppMessageInternal) => message.messageKey !== keyToDelete,
      ),
    });
  };

  public render(): JSX.Element {
    const { messages } = this.state;

    return (
      <div className="_uiComponent_appMessages">
        {messages.map((message: IAppMessageInternal) => (
          <AppMessage
            key={message.messageKey}
            messageKey={message.messageKey}
            onClose={message.onClose}
            message={message.message}
          />
        ))}
      </div>
    );
  }
}
