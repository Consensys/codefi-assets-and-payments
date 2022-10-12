import React from 'react';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

import Checkbox from 'uiComponents/Checkbox';

const properties: Array<IProperty> = [
  {
    label: 'label',
    optional: true,
    type: 'string',
    comment: 'Text label',
  },
  {
    label: 'checked',
    optional: true,
    type: 'boolean',
    comment: 'Default value for the checkbox',
  },
  {
    label: 'disabled',
    optional: true,
    type: 'boolean',
  },
  {
    label: 'name',
    optional: true,
    type: 'string',
    comment: 'Usefull to get the box in a form elements by name.',
  },
  {
    label: 'onChange',
    optional: true,
    type: '(event: React.FormEvent<HTMLInputElement>) => void',
    comment: 'Hook triggered when the box is checked on unchecked.',
  },
  {
    label: 'className',
    optional: true,
    type: 'string',
  },
  {
    label: 'id',
    optional: true,
    type: 'string',
  },
];

const methods: Array<IProperty> = [
  {
    label: 'Method: setValue',
    parameters: [
      {
        label: 'value',
        type: 'boolean',
      },
    ],
    example: 'myCheckbox.setValue(true);',
    comment:
      'If you need to change programatically the checked state of a checkbox.',
  },
];

const CheckboxGuide: React.FC = () => {
  return (
    <div>
      <h2>Checkbox</h2>

      <p>A component for forms</p>

      <h3>Examples</h3>

      <Example
        code={`import Checkbox from 'uiComponents/Checkbox';

<Checkbox label="Basic checkbox" />
<Checkbox label="Checked checkbox" checked />
<Checkbox label="Disabled checkbox" disabled />
<Checkbox label="Checked and disabled checkbox" checked disabled />`}
      >
        <Checkbox label="Basic checkbox" />

        <Checkbox label="Checked checkbox" checked />

        <Checkbox label="Disabled checkbox" disabled />

        <Checkbox label="Checked and disabled checkbox" checked disabled />
      </Example>

      <Properties title="Methods" properties={methods} />

      <Properties properties={properties} />
    </div>
  );
};
export default CheckboxGuide;
