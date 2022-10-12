import React from 'react';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

import Pill from 'uiComponents/Pill';

const properties: Array<IProperty> = [
  {
    label: 'label',
    type: 'string',
  },
  {
    label: 'action',
    optional: true,
    type: '() => void',
  },
  {
    label: 'color',
    optional: true,
    type: "accent1' | 'accent2' | 'accent3' | 'accent4' | 'accent5'",
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
  {
    label: 'style',
    optional: true,
    type: 'CSS.Properties',
  },
];

const PillGuide: React.FC = () => {
  return (
    <div>
      <h2>Pill</h2>

      <p>The Pill component is used all around the application.</p>

      <h3>Examples</h3>

      <Example
        code={`import Pill from 'uiComponents/Pill';

<Pill label="Pill label" />
<Pill label="Pill with action" action={() => alert('Hello')} />
<Pill label="Pill with accent1 color" color="accent1" />
<Pill label="Pill with accent2 color" color="accent2" />
<Pill label="Pill with accent3 color" color="accent3" />
<Pill label="Pill with accent4 color" color="accent4" />
<Pill label="Pill with accent5 color" color="accent5" />`}
      >
        <Pill label="Pill label" />
        <br />
        <br />
        <Pill label="Pill with action" action={() => alert('Hello')} />
        <br />
        <br />
        <Pill label="Pill with accent1 color" color="accent1" />
        <br />
        <br />
        <Pill label="Pill with accent2 color" color="accent2" />
        <br />
        <br />
        <Pill label="Pill with accent3 color" color="accent3" />
        <br />
        <br />
        <Pill label="Pill with accent4 color" color="accent4" />
        <br />
        <br />
        <Pill label="Pill with accent5 color" color="accent5" />
        <br />
        <br />
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default PillGuide;
