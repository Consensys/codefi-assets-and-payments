import React from 'react';
import Example from '../components/Example';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { mdiInformation, mdiCheckCircle } from '@mdi/js';
import { colors } from 'constants/styles';
import Properties from '../components/Properties';
import { EventEmitter, Events } from 'features/events/EventEmitter';

const AppMessagesGuide: React.FC = () => {
  return (
    <div>
      <h2>App messages</h2>

      <p>
        Provide your users with an unimportant temporary message – usually
        straight after an action.
      </p>

      <h3>Examples</h3>

      <Example
        code={`import Acta from 'acta';
import { ACTA_EVENT_APP_MESSAGE } from 'constants/eventKeys';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';

<button
  onClick={() =>
    Acta.dispatchEvent(
      ACTA_EVENT_APP_MESSAGE,
      appMessageData({
        action: () => alert('action'), // optional
        actionLabel: 'Action', // optional
        color: colors.success, // optional
        icon: mdiCheckCircle, // optional
        isDark: true, // optional
        message: 'Main message',
        secondaryMessage: 'Secondary message', // optional
      })
    )
  }>
  Default message
</button>`}
      >
        <button
          onClick={() =>
            EventEmitter.dispatch(
              Events.EVENT_APP_MESSAGE,
              appMessageData({
                message: 'Default message',
              }),
            )
          }
        >
          Default message
        </button>
        <br />
        <br />

        <button
          onClick={() =>
            EventEmitter.dispatch(
              Events.EVENT_APP_MESSAGE,
              appMessageData({
                message: 'Default message',
                duration: 500,
              }),
            )
          }
        >
          Default message with short duration
        </button>
        <br />
        <br />

        <button
          onClick={() =>
            EventEmitter.dispatch(
              Events.EVENT_APP_MESSAGE,
              appMessageData({
                message: 'Main message',
                secondaryMessage: 'Secondary message',
              }),
            )
          }
        >
          With secondary message
        </button>
        <br />
        <br />

        <button
          onClick={() =>
            EventEmitter.dispatch(
              Events.EVENT_APP_MESSAGE,
              appMessageData({
                message: 'Main message',
                secondaryMessage: 'Secondary message',
                action: () => alert('action'),
                actionLabel: 'Action',
              }),
            )
          }
        >
          With an action
        </button>
        <br />
        <br />

        <button
          onClick={() =>
            EventEmitter.dispatch(
              Events.EVENT_APP_MESSAGE,
              appMessageData({
                message: 'Main message',
                secondaryMessage: 'Secondary message',
                action: () => alert('action'),
                actionLabel: 'Action',
                icon: mdiInformation,
              }),
            )
          }
        >
          With an icon
        </button>
        <br />
        <br />

        <button
          onClick={() =>
            EventEmitter.dispatch(
              Events.EVENT_APP_MESSAGE,
              appMessageData({
                message: 'Main message',
                secondaryMessage: 'Secondary message',
                action: () => alert('action'),
                actionLabel: 'Action',
                icon: mdiCheckCircle,
                color: colors.success,
              }),
            )
          }
        >
          With a color
        </button>

        <br />
        <br />
        <hr />
        <br />

        <button
          onClick={() =>
            EventEmitter.dispatch(
              Events.EVENT_APP_MESSAGE,
              appMessageData({
                isDark: true,
                message: 'Default message',
              }),
            )
          }
        >
          Default message // Dark
        </button>
        <br />
        <br />

        <button
          onClick={() =>
            EventEmitter.dispatch(
              Events.EVENT_APP_MESSAGE,
              appMessageData({
                isDark: true,
                message: 'Default message',
                duration: 200,
              }),
            )
          }
        >
          Default message with short duration // Dark
        </button>
        <br />
        <br />

        <button
          onClick={() =>
            EventEmitter.dispatch(
              Events.EVENT_APP_MESSAGE,
              appMessageData({
                isDark: true,
                message: 'Main message',
                secondaryMessage: 'Secondary message',
              }),
            )
          }
        >
          With secondary message // Dark
        </button>
        <br />
        <br />

        <button
          onClick={() =>
            EventEmitter.dispatch(
              Events.EVENT_APP_MESSAGE,
              appMessageData({
                isDark: true,
                message: 'Main message',
                secondaryMessage: 'Secondary message',
                action: () => alert('action'),
                actionLabel: 'Action',
              }),
            )
          }
        >
          With an action // Dark
        </button>
        <br />
        <br />

        <button
          onClick={() =>
            EventEmitter.dispatch(
              Events.EVENT_APP_MESSAGE,
              appMessageData({
                isDark: true,
                message: 'Main message',
                secondaryMessage: 'Secondary message',
                action: () => alert('action'),
                actionLabel: 'Action',
                icon: mdiInformation,
              }),
            )
          }
        >
          With an icon // Dark
        </button>
        <br />
        <br />

        <button
          onClick={() =>
            EventEmitter.dispatch(
              Events.EVENT_APP_MESSAGE,
              appMessageData({
                action: () => alert('action'),
                actionLabel: 'Action',
                color: colors.success,
                icon: mdiCheckCircle,
                isDark: true,
                message: 'Main message',
                secondaryMessage: 'Secondary message',
              }),
            )
          }
        >
          With a color // Dark
        </button>
      </Example>

      <Properties
        properties={[
          {
            label: 'message',
            type: 'string',
          },
          {
            label: 'action',
            optional: true,
            type: '() => void',
            comment: 'The action executed when the action button is pressed.',
          },
          {
            label: 'actionLabel',
            optional: true,
            type: 'string',
            comment:
              'The label of the action button on the right side of the message.',
          },
          {
            label: 'color',
            optional: true,
            type: 'string',
            comment:
              'This will be the color of the icon and the action button label if they exist. Can use a color from the styles.',
            example: `import { colors } from 'constants/styles';
[...]
    color: colors.main,
[...]`,
          },
          {
            label: 'duration',
            optional: true,
            type: 'number',
            defaultValue: '4000',
            comment: 'The value is in milliseconds.',
          },
          {
            label: 'icon',
            optional: true,
            type: 'string',
            comment:
              'Must be a valid svg path. Import from the mdi/js package.',
            example: `import { mdiInformation } from '@mdi/js';
[...]
    icon: mdiInformation,
[...]`,
          },
          {
            label: 'isDark',
            optional: true,
            type: 'boolean',
            comment: 'Dark theme for the notification.',
          },
          {
            label: 'secondaryMessage',
            optional: true,
            type: 'string',
            comment: 'Displayed under the main message.',
          },
        ]}
        title="IAppMessage interface"
      />
    </div>
  );
};
export default AppMessagesGuide;
