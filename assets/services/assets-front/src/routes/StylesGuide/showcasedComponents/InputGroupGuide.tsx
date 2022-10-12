import React from 'react';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

import InputGroup, { Column } from 'uiComponents/InputGroup/InputGroup';
import Input from 'uiComponents/Input';
import Checkbox from 'uiComponents/Checkbox';
import Radio from 'uiComponents/Radio';
import Select from 'uiComponents/Select';

const properties: Array<IProperty> = [
  {
    label: 'InputGroup - children',
    type: 'Array<Column>',
  },
  {
    label: 'InputGroup - id',
    optional: true,
    type: 'string',
  },
  {
    label: 'InputGroup - title',
    optional: true,
    type: 'string',
  },
  {
    label: 'InputGroup - className',
    optional: true,
    type: 'string',
  },
  {
    label: 'InputGroup - style',
    optional: true,
    type: 'CSS.Properties',
  },

  {
    label: 'Column - children',
    optional: true,
    type: 'React.ReactNode',
  },
  {
    label: 'Column - className',
    optional: true,
    type: 'string',
  },
  {
    label: 'Column - id',
    optional: true,
    type: 'string',
  },
  {
    label: 'Column - style',
    optional: true,
    type: 'CSS.Properties',
  },
];

const InputGroupGuide: React.FC = () => {
  return (
    <div>
      <h2>Input Group</h2>

      <p>
        Purely presentationnal component to arrange inputs in one to 6 columns.
        Pay attention to the size of the end result.
      </p>

      <h2>Examples</h2>

      <Example
        code={`import InputGroup, { Column } from 'uiComponents/InputGroup/InputGroup';
import Input from 'uiComponents/Input';
import Checkbox from 'uiComponents/Checkbox';
import Radio from 'uiComponents/Radio';
import Select from 'uiComponents/Select';

<InputGroup title="Group title">
  <Column>
    <Input label="Input label" placeholder="A placeholder" />
    <Input label="Input label" placeholder="A placeholder" />
    <Select options={['a', 'b', 'c']} label="Select label" />
  </Column>

  <Column>
    <Checkbox checked label="A nice check label" />
    <Checkbox label="A nice check label" />
    <Checkbox disabled label="A nice check label" />
  </Column>

  <Column>
    <Radio checked label="A nice radio label" name="radio1" />
    <Radio label="A nice radio label" name="radio1" />
    <Radio disabled label="A nice radio label" name="radio1" />
  </Column>
</InputGroup>`}
      >
        <InputGroup title="Group title">
          <Column>
            <Input label="Input label" placeholder="A placeholder" />
            <Input label="Input label" placeholder="A placeholder" />
            <Select options={['a', 'b', 'c']} label="Select label" />
          </Column>

          <Column>
            <Checkbox checked label="A nice check label" />
            <Checkbox label="A nice check label" />
            <Checkbox disabled label="A nice check label" />
          </Column>

          <Column>
            <Radio checked label="A nice radio label" name="radio1" />
            <Radio label="A nice radio label" name="radio1" />
            <Radio disabled label="A nice radio label" name="radio1" />
          </Column>
        </InputGroup>
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default InputGroupGuide;
