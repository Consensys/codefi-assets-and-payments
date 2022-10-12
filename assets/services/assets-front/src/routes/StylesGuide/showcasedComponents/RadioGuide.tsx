import React from 'react';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

import Radio from 'uiComponents/Radio';

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
    comment: 'Default value for the Radio',
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

const RadioGuide: React.FC = () => {
  return (
    <div>
      <h2>Radio</h2>

      <p>
        A radio component for forms. Radio buttons have to be groupped together
        to work. To group them together, set the same value in their “name“
        attribute.
      </p>

      <h3>Examples</h3>

      <Example
        code={`import Radio from 'uiComponents/Radio';

<p>Basic radio choices</p>
<Radio label="Choice 1" name="radio1" />
<Radio label="Choice 2" name="radio1" checked />
<Radio label="Disabled choice" name="radio1" disabled />

<p>Basic radio choices with a disabled checked choice</p>
<Radio label="Disabled choice 1" name="radio2" disabled />
<Radio label="Disabled choice 2" name="radio2" disabled />
<Radio label="Disabled checked choice" name="radio2" checked disabled />`}
      >
        <p>Basic radio choices</p>
        <Radio label="Choice 1" name="radio1" />
        <Radio label="Choice 2" name="radio1" checked />
        <Radio label="Disabled choice" name="radio1" disabled />

        <br />

        <p>Basic radio choices with a disabled checked choice</p>
        <Radio label="Disabled choice 1" name="radio2" disabled />
        <Radio label="Disabled choice 2" name="radio2" disabled />
        <Radio label="Disabled checked choice" name="radio2" checked disabled />
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default RadioGuide;
