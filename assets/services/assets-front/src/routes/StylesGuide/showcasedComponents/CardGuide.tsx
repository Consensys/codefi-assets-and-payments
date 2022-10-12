import React from 'react';

import { Card } from 'uiComponents/Card';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

const properties: Array<IProperty> = [
  {
    label: 'children',
    type: 'React.ReactNode',
    example: '<div>Hello workd</div>',
  },
  {
    label: 'className',
    optional: true,
    type: 'string',
    example: 'myClass',
  },
  {
    label: 'containerRef',
    optional: true,
    type: 'Function',
    comment:
      'This should be a function referencing a local variable like "(input) => localInput = input"',
  },
  {
    label: 'id',
    optional: true,
    type: 'string',
    example: 'myId',
  },
  {
    label: 'htmlTag',
    optional: true,
    type: 'string',
    example: 'menu, header, h3... or any html valid tag',
    defaultValue: 'div',
  },
  {
    label: 'style',
    optional: true,
    type: 'CSS.Properties',
    comment:
      'It must be a valid CSS object; your IDE should help you for the validation. See https://www.npmjs.com/package/csstype',
  },
];

const CardGuide: React.FC = () => {
  return (
    <div>
      <h2>Card</h2>

      <p>
        The Card component is a simple container used to build more complex
        components.
      </p>

      <h3>Example</h3>

      <Example
        code={`import { Card } from 'uiComponents/Card';

<Card style={{ padding: '20px', textAlign: 'center' }}>
  This is a card
</Card>`}
      >
        <Card style={{ padding: '20px', textAlign: 'center' }}>
          This is a card
        </Card>
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default CardGuide;
