import React from 'react';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

import Input from 'uiComponents/Input';
import InputDate from 'uiComponents/InputDate';

const properties: Array<IProperty> = [
  {
    label: 'type',
    optional: true,
    type: `'text' |
'date' |
'textarea' |
'email' |
'color' |
'number' |
'password' |
'range' |
'search' |
'tel' |
string'`,
    defaultValue: 'text',
  },
  {
    label: 'label',
    optional: true,
    type: `string |
React.ReactNode`,
    comment:
      'The main label for the input. Can be a simple text or a ReactNode for more complex cases.',
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
    label: 'required',
    optional: true,
    type: 'boolean',
    comment:
      'Inside a form only. The form cannot be submitted if the input is not filled.',
  },
  {
    label: 'defaultValue',
    optional: true,
    type: `string |
Date |
number`,
    comment: 'Initial value for the input.',
  },
  {
    label: 'disabled',
    optional: true,
    type: 'boolean',
    comment: 'If a user cannot interact with the input.',
  },
  {
    label: 'error',
    optional: true,
    type: `string |
React.ReactNode`,
    comment:
      'The error label under the input. Can be a simple text or a ReactNode for more complex cases.',
  },
  {
    label: 'max',
    optional: true,
    type: `string |
number`,
    comment: 'Makes sense only for a number input.',
  },
  {
    label: 'maxLength',
    optional: true,
    type: 'number',
    comment: 'Makes sense only for a text input.',
  },
  {
    label: 'min',
    optional: true,
    type: `string |
number`,
    comment: 'Makes sense only for a number input.',
  },
  {
    label: 'minLength',
    optional: true,
    type: 'number',
    comment: 'Makes sense only for a text input.',
  },
  {
    label: 'name',
    optional: true,
    type: 'string',
    comment:
      'To name the input inside a form. Usefull to get the value from the form elements.',
  },
  {
    label: 'onBlur',
    optional: true,
    type: `(
  event: React.FormEvent<
    HTMLInputElement |
    HTMLTextAreaElement
  >,
  value?: string,
) => void | Promise<void>`,
  },
  {
    label: 'onChange',
    optional: true,
    type: `(
  event: React.FormEvent<
    HTMLInputElement |
    HTMLTextAreaElement
  >,
  value?: string,
) => void | Promise<void>`,
  },
  {
    label: 'onFocus',
    optional: true,
    type: `(
  event: React.FormEvent<
    HTMLInputElement |
    HTMLTextAreaElement
  >,
  value?: string,
) => void | Promise<void>`,
  },
  {
    label: 'onKeyDown',
    optional: true,
    type: `(
  event: React.KeyboardEvent<
    HTMLInputElement>,
    value
  ?:
  string, )
> void | Promise<void>`,
  },
  {
    label: 'pattern',
    optional: true,
    type: 'string (regex)',
    comment:
      'Inside a form only. The form cannot be submitted if the input value does not match the regex. Not required for email, just use "email" in "type".',
  },
  {
    label: 'step',
    optional: true,
    type: 'string',
    comment:
      'Makes sense only for a number input. Can be "0.1" for example if you want the number to have a one decimal precision. Or "1" if you want to have integers.',
  },
  {
    label: 'warning',
    optional: true,
    type: `string |
React.ReactNode`,
    comment:
      'The warning label under the input. Can be a simple text or a ReactNode for more complex cases.',
  },
  {
    label: 'id',
    optional: true,
    type: 'string',
  },
  {
    label: 'className',
    optional: true,
    type: 'string',
  },
];

const InputGuide: React.FC = () => {
  return (
    <div>
      <h2>Input</h2>

      <p>
        The most important component for the forms. This component will be
        extended in the future.
      </p>

      <h2>Examples</h2>

      <Example
        code={`import Input from 'uiComponents/Input';

<Input
  label="Input label"
  placeholder="This is the placeholder"
  sublabel="This is a sublabel"
/>

<Input
  label="Input label"
  placeholder="This is the placeholder"
  type="textarea"
/>

<InputDate label="Input label" />

<Input label="Input label" type="color" />

<Input label="Input label" type="password" defaultValue="password" />

<Input label="Input label" type="range" />

<Input label="Input label" type="number" min={0} max={100} step="0.1" />

<Input
  label="Input label"
  placeholder="This is the placeholder"
  disabled
/>

<Input
  label="Input label"
  placeholder="This is the placeholder"
  warning="This is an warning message"
/>

<Input
  label="Input label"
  placeholder="This is the placeholder"
  error="This is an error message"
/>
`}
      >
        <Input
          label="Input label"
          placeholder="This is the placeholder"
          sublabel="This is a sublabel"
        />

        <Input
          label="Input label"
          placeholder="This is the placeholder"
          type="textarea"
        />

        <InputDate label="Input label" />

        <Input label="Input label" type="color" />

        <Input label="Input label" type="password" defaultValue="password" />

        <Input label="Input label" type="range" />

        <Input label="Input label" type="number" min={0} max={100} step="0.1" />

        <Input
          label="Input label"
          placeholder="This is the placeholder"
          disabled
        />

        <Input
          label="Input label"
          placeholder="This is the placeholder"
          warning="This is an warning message"
        />

        <Input
          label="Input label"
          placeholder="This is the placeholder"
          error="This is an error message"
        />
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default InputGuide;
