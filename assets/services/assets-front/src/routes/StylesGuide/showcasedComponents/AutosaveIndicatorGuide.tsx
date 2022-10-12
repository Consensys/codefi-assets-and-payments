import React from 'react';

import AutosaveIndicator from 'uiComponents/AutosaveIndicator';
import Example from '../components/Example';
import Properties from '../components/Properties';

const AutosaveIndicatorGuide: React.FC = () => {
  return (
    <div>
      <h2>Autosave indicator</h2>

      <p>
        A component that lets the user know the progress of a process that’s
        autosaves.
      </p>

      <p>
        If you don’t pass any parameters to the component, it will render an
        empty fragment. It makes sense before the users started to do anything.
      </p>

      <p>
        You can only pass one param. More than one would produce a weird
        behaviour.
      </p>

      <h3>Examples</h3>

      <Example
        code={`import AutosaveIndicator from 'uiComponents/AutosaveIndicator';

<AutosaveIndicator isSaving />

<AutosaveIndicator isSaved />

<AutosaveIndicator hasSavingError />

<AutosaveIndicator
  hasSavingError
  saveAgainAction={() => alert('save again')}
/>`}
      >
        <AutosaveIndicator isSaving />

        <br />

        <AutosaveIndicator isSaved />

        <br />

        <AutosaveIndicator hasSavingError />

        <br />

        <AutosaveIndicator
          hasSavingError
          saveAgainAction={() => alert('save again')}
        />
      </Example>

      <Properties
        properties={[
          {
            label: 'hasSavingError',
            optional: true,
            type: 'boolean',
          },
          {
            label: 'isSaved',
            optional: true,
            type: 'boolean',
          },
          {
            label: 'isSaving',
            optional: true,
            type: 'boolean',
          },
          {
            label: 'saveAgainAction',
            optional: true,
            type: '() => void',
            comment:
              'If isSaving is set to true, you can add a manual action to re-save the current informations.',
          },
        ]}
      />
    </div>
  );
};
export default AutosaveIndicatorGuide;
