import React from 'react';
import { mdiAccountCircle } from '@mdi/js';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

import Button from 'uiComponents/Button';
import { colors } from 'constants/styles';

const properties: Array<IProperty> = [
  {
    label: 'children',
    optional: true,
    type: 'React.ReactNode',
    example: '<div>Hello workd</div>',
    comment:
      'If you need to do something complicated in your button, you can go for <Button>{ReactNode}</Button> and not providing any label or icon.',
  },
  {
    label: 'secondary',
    optional: true,
    type: 'boolean',
    comment:
      'The button has now a white background and a border. The text, the border and the potential loader have the same color.',
  },
  {
    label: 'tertiary',
    optional: true,
    type: 'boolean',
    comment:
      'The button has now now border and no background. It is underlined when hover. The hover line, the text and the potential loader have the same color.',
  },
  {
    label: 'className',
    optional: true,
    type: 'string',
  },
  {
    label: 'color',
    optional: true,
    type: 'string',
  },
  {
    label: 'disabled',
    optional: true,
    type: 'boolean',
  },
  {
    label: 'formAction',
    optional: true,
    type: 'string',
    comment: 'Makes sense only in a form.',
  },
  {
    label: 'href',
    optional: true,
    type: 'string',
    comment: 'The button becomes a React Router Link',
  },
  {
    label: 'iconLeft',
    optional: true,
    type: 'string',
    comment:
      "You must provide an svg path. ie: import { mdiAccountCircle } from '@mdi/js';",
  },
  {
    label: 'iconRight',
    optional: true,
    type: 'string',
    comment: 'To have the icon on the right of the button',
  },
  {
    label: 'id',
    optional: true,
    type: 'string',
  },
  {
    label: 'isLoading',
    optional: true,
    type: 'boolean',
    comment:
      'Typically, this would be attached to a form state and switch to true when the form is submiting data. The button becomes disabled and the form cannot be submitted. <Button isLoading={this.state.isFormSubmitting}/>',
  },
  {
    label: 'label',
    optional: true,
    type: 'string',
  },
  {
    label: 'name',
    optional: true,
    type: 'string',
    comment: 'This makes sense only inside a form.',
  },
  {
    label: 'onClick',
    optional: true,
    type: '(event: React.MouseEvent) => void',
  },
  {
    label: 'onMouseDown',
    optional: true,
    type: '(event: React.MouseEvent) => void',
  },
  {
    label: 'onMouseOver',
    optional: true,
    type: '(event: React.MouseEvent) => void',
  },
  {
    label: 'onMouseUp',
    optional: true,
    type: '(event: React.MouseEvent) => void',
  },
  {
    label: 'size',
    optional: true,
    type: "'small' | 'big'",
  },
  {
    label: 'style',
    optional: true,
    type: 'CSS.Properties',
    comment:
      'It must be a valid CSS object; your IDE should help you for the validation. See https://www.npmjs.com/package/csstype',
  },
  {
    label: 'type',
    optional: true,
    type: "'button' | 'submit' | 'reset'",
    defaultValue: 'button',
    comment:
      'By default a button in a broswer has a type submit. Which means that it will submit any form it’s in. We give the default type button. If you want your button to submit a form, give it the type submit.',
  },
  {
    label: 'value',
    optional: true,
    type: 'string | number',
  },
  {
    label: 'width',
    optional: true,
    type: 'number | string',
    comment:
      'A number will become a value in pixel. You can also provide any compatible value like "auto" or "50%".',
  },
];

const ButtonGuide: React.FC = () => {
  return (
    <div>
      <h2>Button</h2>

      <p>The button component is used all around the application.</p>

      <h3>Examples</h3>

      <Example
        code={`import Button from 'uiComponents/Button';

<Button label="Button label" />
<Button label="Button label" iconLeft={mdiAccountCircle} />
<Button label="Button label" disabled />
<Button label="Button label" isLoading />

<Button label="Button label" secondary />
<Button label="Button label" secondary iconLeft={mdiAccountCircle} />
<Button label="Button label" secondary disabled />
<Button label="Button label" secondary isLoading />

<Button label="Button label" tertiary />
<Button label="Button label" tertiary iconLeft={mdiAccountCircle} />
<Button label="Button label" tertiary disabled />
<Button label="Button label" tertiary isLoading />

<Button label="Button label" color={colors.errorDark} />
<Button label="Button label" secondary isLoading color={colors.warningDark} />
<Button label="Button label" tertiary color={colors.successDark} />`}
      >
        <div>
          <Button label="Button label" style={{ margin: '10px' }} />
          <Button
            label="Button label"
            iconLeft={mdiAccountCircle}
            style={{ margin: '10px' }}
          />
          <Button label="Button label" disabled style={{ margin: '10px' }} />
          <Button label="Button label" isLoading style={{ margin: '10px' }} />

          <Button label="Button label" secondary style={{ margin: '10px' }} />
          <Button
            label="Button label"
            secondary
            iconLeft={mdiAccountCircle}
            style={{ margin: '10px' }}
          />
          <Button
            label="Button label"
            secondary
            disabled
            style={{ margin: '10px' }}
          />
          <Button
            label="Button label"
            secondary
            isLoading
            style={{ margin: '10px' }}
          />

          <Button label="Button label" tertiary style={{ margin: '10px' }} />
          <Button
            label="Button label"
            tertiary
            iconLeft={mdiAccountCircle}
            style={{ margin: '10px' }}
          />
          <Button
            label="Button label"
            tertiary
            disabled
            style={{ margin: '10px' }}
          />
          <Button
            label="Button label"
            tertiary
            isLoading
            style={{ margin: '10px' }}
          />

          <Button
            label="Button label"
            style={{ margin: '10px' }}
            color={colors.errorDark}
          />
          <Button
            label="Button label"
            secondary
            isLoading
            color={colors.warningDark}
            style={{ margin: '10px' }}
          />
          <Button
            label="Button label"
            tertiary
            color={colors.successDark}
            style={{ margin: '10px' }}
          />
        </div>
      </Example>

      <Example
        code={`import Button from 'uiComponents/Button';

<Button size="small" label="Button label" />
<Button size="small" label="Button label" iconLeft={mdiAccountCircle} />
<Button size="small" label="Button label" disabled />
<Button size="small" label="Button label" isLoading />

<Button size="small" label="Button label" secondary />
<Button size="small" label="Button label" secondary iconLeft={mdiAccountCircle} />
<Button size="small" label="Button label" secondary disabled />
<Button size="small" label="Button label" secondary isLoading />

<Button size="small" label="Button label" tertiary />
<Button size="small" label="Button label" tertiary iconLeft={mdiAccountCircle} />
<Button size="small" label="Button label" tertiary disabled />
<Button size="small" label="Button label" tertiary isLoading />

<Button size="small" label="Button label" color={colors.errorDark} />
<Button size="small" label="Button label" secondary isLoading color={colors.warningDark} />
<Button size="small" label="Button label" tertiary color={colors.successDark} />`}
      >
        <div>
          <Button
            size="small"
            label="Button label"
            style={{ margin: '10px' }}
          />
          <Button
            size="small"
            label="Button label"
            iconLeft={mdiAccountCircle}
            style={{ margin: '10px' }}
          />
          <Button
            size="small"
            label="Button label"
            disabled
            style={{ margin: '10px' }}
          />
          <Button
            size="small"
            label="Button label"
            isLoading
            style={{ margin: '10px' }}
          />

          <Button
            size="small"
            label="Button label"
            secondary
            style={{ margin: '10px' }}
          />
          <Button
            size="small"
            label="Button label"
            secondary
            iconLeft={mdiAccountCircle}
            style={{ margin: '10px' }}
          />
          <Button
            size="small"
            label="Button label"
            secondary
            disabled
            style={{ margin: '10px' }}
          />
          <Button
            size="small"
            label="Button label"
            secondary
            isLoading
            style={{ margin: '10px' }}
          />

          <Button
            size="small"
            label="Button label"
            tertiary
            style={{ margin: '10px' }}
          />
          <Button
            size="small"
            label="Button label"
            tertiary
            iconLeft={mdiAccountCircle}
            style={{ margin: '10px' }}
          />
          <Button
            size="small"
            label="Button label"
            tertiary
            disabled
            style={{ margin: '10px' }}
          />
          <Button
            size="small"
            label="Button label"
            tertiary
            isLoading
            style={{ margin: '10px' }}
          />

          <Button
            size="small"
            label="Button label"
            style={{ margin: '10px' }}
            color={colors.errorDark}
          />
          <Button
            size="small"
            label="Button label"
            secondary
            isLoading
            color={colors.warningDark}
            style={{ margin: '10px' }}
          />
          <Button
            size="small"
            label="Button label"
            tertiary
            color={colors.successDark}
            style={{ margin: '10px' }}
          />
        </div>
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default ButtonGuide;
