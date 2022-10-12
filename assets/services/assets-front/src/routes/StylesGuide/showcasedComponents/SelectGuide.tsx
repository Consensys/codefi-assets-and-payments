import React from 'react';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

import Select from 'uiComponents/Select';

const properties: Array<IProperty> = [
  {
    label: 'options',
    type: `Array<
  string |
  {
    label: string;
    value: string;
    disabled?: boolean;
  }
>`,
    example: `['a', 'b']
or
[
  {
    label: 'label a',
    value: 'a',
  },
  {
    label: 'label b',
    value: 'b',
  },
]`,
  },
  {
    label: 'label',
    type: 'string',
    comment: 'The label above the Select.',
  },
  {
    label: 'sublabel',
    optional: true,
    type: `string |
React.ReactNode`,
    comment:
      'The sub label under the input. Can be a simple text or a ReactNode for more complex cases.',
  },
  {
    label: 'placeholder',
    optional: true,
    type: 'string',
  },
  {
    label: 'defaultValue',
    optional: true,
    type: 'string | number',
    comment: 'The select will start with this value as default.',
  },
  {
    label: 'disabled',
    optional: true,
    type: 'boolean',
    comment: 'The user cannot change the value.',
  },
  {
    label: 'name',
    optional: true,
    type: 'string',
    comment: 'Makes sense only on a form.',
  },
  {
    label: 'onChange',
    optional: true,
    type: '(newValue: string) => void',
    comment: 'This event is often useful.',
  },
  {
    label: 'required',
    optional: true,
    type: 'boolean',
    comment:
      'Makes sense only inside a form. You have to add a placeholder for this to work. Otherwise, it always has a value.',
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

const SelectGuide: React.FC = () => {
  return (
    <div>
      <h2>Select</h2>

      <p>Mostly used in forms</p>

      <h3>Examples</h3>

      <Example
        code={`import Select from 'uiComponents/Select';

<Select
  label="Select label"
  options={['a', 'b']}
/>

<Select
  label="Select label"
  subLabel="Select with subLabel"
  options={['a', 'b']}
/>

<Select
  label="Select label"
  options={[
    {
      label: 'label a',
      value: 'a',
    },
    {
      label: 'label b',
      value: 'b',
    },
  ]}
  placeholder="This is a placeholder"
/>`}
      >
        <Select label="Select label" options={['a', 'b']} />

        <Select
          label="Select label"
          sublabel="Select with subLabel"
          options={['a', 'b']}
        />

        <Select
          label="Select label"
          options={[
            {
              label: 'label a',
              value: 'a',
            },
            {
              label: 'label b',
              value: 'b',
            },
          ]}
          placeholder="This is a placeholder"
        />
        <br />
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default SelectGuide;
