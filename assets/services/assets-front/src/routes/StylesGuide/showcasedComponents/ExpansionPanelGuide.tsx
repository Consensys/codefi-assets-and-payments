import React from 'react';

import ExpansionPanel from 'uiComponents/ExpansionPanel';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

const properties: Array<IProperty> = [
  {
    label: 'label',
    type: 'string',
    example: 'Part 1: Identification',
  },
  {
    label: 'children',
    type: 'React.ReactNode',
    example: '<div>Hello workd</div>',
  },
  {
    label: 'id',
    optional: true,
    type: 'string',
    example: 'myId',
  },
];

const ExpansionPanelGuide: React.FC = () => {
  return (
    <div>
      <h2>ExpansionPanel</h2>

      <p>
        The ExpansionPanel component is a simple container used to build more
        complex components.
      </p>

      <h3>Example</h3>

      <Example
        code={`import ExpansionPanel from 'uiComponents/ExpansionPanel';

<ExpansionPanel label="Part 1: Identification">
  <span>this is an ExpansionPanel</span>
</ExpansionPanel>`}
      >
        <ExpansionPanel label="Part 1: Identification">
          <span>this is an ExpansionPanel</span>
        </ExpansionPanel>
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default ExpansionPanelGuide;
