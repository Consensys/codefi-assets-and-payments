import React from 'react';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

import ProgressBar from 'uiComponents/ProgressBar';

const properties: Array<IProperty> = [
  {
    label: 'className',
    optional: true,
    type: 'string',
  },
  {
    label: 'completion',
    type: 'number',
    comment: 'How completed is the bar.',
  },
  {
    label: 'withLabel',
    optional: true,
    type: 'boolean',
    comment: 'When we have the label, it says exactly how complete the bar is.',
  },
];

const ProgressBarGuide: React.FC = () => {
  return (
    <div>
      <h2>Progress bar</h2>

      <p>The progress bar can be static or dynamic.</p>

      <h2>Examples</h2>

      <Example
        code={`import ProgressBar from 'uiComponents/ProgressBar';

<ProgressBar completion={75} />
<ProgressBar completion={37} withLabel />`}
      >
        <ProgressBar completion={75} />
        <ProgressBar completion={37} withLabel />
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default ProgressBarGuide;
