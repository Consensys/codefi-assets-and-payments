import React from 'react';
import Example from '../components/Example';
import { useDispatch } from 'react-redux';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import Button from 'uiComponents/Button';
import Properties from '../components/Properties';
import { setAppModal } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

const AppMessagesGuide: React.FC = () => {
  const dispatch = useDispatch();
  return (
    <div>
      <h2>App modal</h2>

      <p>
        Modals are a disruptive way of delivering important information, asking
        your user to make a choice or helping them achieve multiple tasks..
      </p>

      <p>
        Click outside of the modal or press the escape key will trigger the
        cancel action.
      </p>

      <p>
        Dispatch the ACTA_EVENT_CLOSE_MODAL event form anywhere in the
        application (includin from inside custom elements in the modal) with
        trigger the cancel action.
      </p>

      <p>
        If no cancel action is defined, the cancel action will simply close the
        modal.
      </p>

      <h3>Simple acknowledgement</h3>

      <Example
        code={`import Acta from 'acta';
import { ACTA_APPLICATION_MODAL } from 'constants/stateKeys';
import { appModalData } from 'uiComponents/AppModal/AppModal';

Acta.setState({
  [ACTA_APPLICATION_MODAL]: appModalData({
    title: 'Simple acknowledgement modal',
    isSimpleAcknowledgement: true,
  }),
})

Acta.setState({
  [ACTA_APPLICATION_MODAL]: appModalData({
    title: 'Simple acknowledgement modal',
    content: (
      <div>
        <p>A paragraph content</p>
        <p>
          A paragraph content with a <a href="#">link</a>
        </p>
      </div>
    ),
    isSimpleAcknowledgement: true,
  }),
})`}
      >
        <button
          onClick={() =>
            dispatch(
              setAppModal(
                appModalData({
                  title: 'Simple acknowledgement modal',
                  isSimpleAcknowledgement: true,
                }),
              ),
            )
          }
        >
          Open simple acknowledgement modal
        </button>

        <br />
        <br />

        <button
          onClick={() =>
            dispatch(
              setAppModal(
                appModalData({
                  title: 'Simple acknowledgement modal',
                  closeIcon: true,
                  content: (
                    <div>
                      <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Mauris mollis hendrerit sapien quis fringilla. Morbi
                        mattis cursus maximus. Nam tempus leo sodales quam
                        lobortis, eu semper orci varius. Ut efficitur turpis vel
                        mattis rutrum. Cras nec tellus ut tortor facilisis
                        varius et vitae lacus. Aliquam convallis, lorem faucibus
                        feugiat efficitur, erat nisl feugiat lorem, et venenatis
                        libero tortor finibus urna. Orci varius natoque
                        penatibus et magnis dis parturient montes, nascetur
                        ridiculus mus. Proin sit amet elementum odio.
                      </p>
                      <p>
                        paragraph content with a <a href="/">link</a>
                      </p>
                    </div>
                  ),
                  isSimpleAcknowledgement: true,
                }),
              ),
            )
          }
        >
          Open simple acknowledgement modal with content and close icon
        </button>
      </Example>

      <h3>Confirm</h3>

      <Example
        code={`import Acta from 'acta';
import { ACTA_APPLICATION_MODAL } from 'constants/stateKeys';
import { appModalData } from 'uiComponents/AppModal/AppModal';

Acta.setState({
  [ACTA_APPLICATION_MODAL]: appModalData({
    title: 'Simple confirm modal',
    confirmAction: () => alert('confirm'),
  }),
})

onClick={() =>
  Acta.setState({
    [ACTA_APPLICATION_MODAL]: appModalData({
      title: 'Simple confirm modal',
      confirmAction: () => alert('confirm'),
      confirmLabel: {
        en: 'Let’s do it',
        fr: 'Faisons ça',
      },
      cancelAction: () => alert('cancel'),
      cancelLabel: {
        en: 'Oh noes!',
        fr: 'Surtout pas',
      },
      content: (
        <div>
          <p>A paragraph content</p>
          <p>
            A paragraph content with a <a href="#">link</a>
          </p>
        </div>
      ),
    }),
  })`}
      >
        <button
          onClick={() =>
            dispatch(
              setAppModal(
                appModalData({
                  title: 'Simple confirm modal',
                  confirmAction: () => alert('confirm'),
                }),
              ),
            )
          }
        >
          Open minimal confirm
        </button>

        <br />
        <br />

        <button
          onClick={() =>
            dispatch(
              setAppModal(
                appModalData({
                  title: 'Simple confirm modal',
                  confirmAction: () => alert('confirm'),
                  confirmLabel: {
                    en: 'Let’s do it',
                    fr: 'Faisons ça',
                  },
                  cancelAction: () => alert('cancel'),
                  cancelLabel: {
                    en: 'Oh noes!',
                    fr: 'Surtout pas',
                  },
                  content: (
                    <div>
                      <p>A paragraph content</p>
                      <p>
                        A paragraph content with a <a href="/">link</a>
                      </p>
                    </div>
                  ),
                }),
              ),
            )
          }
        >
          Open full options confirm
        </button>
      </Example>

      <h3>With custom content</h3>

      <Example
        code={`import Acta from 'acta';
import Button from 'uiComponents/Button';
import { ACTA_APPLICATION_MODAL } from 'constants/stateKeys';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { ACTA_EVENT_CLOSE_MODAL } from 'constants/eventKeys';

<button
  onClick={() => {
    const content = (
      <div>
        <p>This is a custom content.</p>

        <Button
          label={'cancel'}
          onClick={() => Acta.dispatchEvent(ACTA_EVENT_CLOSE_MODAL)}
        />

        <Button
          label={'submit'}
          onClick={() => {
            alert('on submit');
            Acta.dispatchEvent(ACTA_EVENT_CLOSE_MODAL);
          }}
        />
      </div>
    );

    Acta.setState({
      [ACTA_APPLICATION_MODAL]: appModalData({
        title: 'Simple acknowledgement modal',
        content,
      }),
    });
  }}>
  Open modal with custom content
</button>`}
      >
        <button
          onClick={() => {
            const content = (
              <div>
                <p>This is a custom content.</p>

                <Button
                  label="cancel"
                  onClick={() =>
                    EventEmitter.dispatch(Events.EVENT_CLOSE_MODAL)
                  }
                />

                <Button
                  label="submit"
                  onClick={() => {
                    alert('on submit');
                    EventEmitter.dispatch(Events.EVENT_CLOSE_MODAL);
                  }}
                />
              </div>
            );
            dispatch(
              setAppModal(
                appModalData({
                  content,
                }),
              ),
            );
          }}
        >
          Open modal with custom content
        </button>
      </Example>

      <Properties
        title="Appmodal data"
        properties={[
          {
            label: 'title',
            type: 'string',
            comment: 'The title of the modal.',
            optional: true,
          },
          {
            label: 'content',
            optional: true,
            type: 'React.ReactNode',
            comment: 'You can pass a simple string or a complexe component.',
            example: '<MyComponent />',
          },
          {
            label: 'isSimpleAcknowledgement',
            optional: true,
            type: 'boolean',
            comment:
              'If set to true, the modal will have a simple button to close itself.',
          },
          {
            label: 'acknowledgementLabel',
            optional: true,
            type: '{ [key: string]: string }',
            comment: 'The label must be translated.',
            example: `{
  en: 'My label',
  fr: 'Mon label',
}`,
            defaultValue: `{
  en: 'Ok',
  fr: 'Ok',
}`,
          },
          {
            label: 'acknowledgementAction',
            optional: true,
            type: '() => void',
            comment:
              'If the acknowledgement is required to go to the next step, pass the action here. If none is defined and the isSimpleAcknowledgement param is passed, the action will simply close the modal.',
          },
          {
            label: 'cancelAction',
            optional: true,
            type: '() => void',
            comment:
              'Action triggered when the user press the cancel button. If none is defined, the action will simply close the modal.',
          },
          {
            label: 'cancelLabel',
            optional: true,
            type: '{ [key: string]: string }',
            comment: 'The label in the cancel button.',
            defaultValue: `{
  en: 'Cancel',
  fr: 'Annuler',
}`,
          },
          {
            label: 'closeIcon',
            optional: true,
            type: 'string',
            comment: 'Display close icon in modal header',
          },
          {
            label: 'confirmAction',
            optional: true,
            type: '() => void',
            comment:
              'The action performed when the user presses the conform button. It will also close the window. It is required to display a cancel / confirm button.',
          },
          {
            label: 'confirmLabel',
            optional: true,
            type: '{ [key: string]: string }',
            comment: 'The label in the cancel button.',
            defaultValue: `{
  en: 'Confirm',
  fr: 'Confirmer',
}`,
          },
          {
            label: 'confirmColor',
            optional: true,
            type: 'string',
            comment: 'The color for the cancel button label.',
            defaultValue: 'colors.main',
          },
        ]}
      />
    </div>
  );
};
export default AppMessagesGuide;
