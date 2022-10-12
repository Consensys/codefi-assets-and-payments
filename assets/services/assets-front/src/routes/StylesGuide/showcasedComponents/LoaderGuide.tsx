import React from 'react';

import Loader from 'uiComponents/Loader';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

const properties: Array<IProperty> = [
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
    label: 'label',
    optional: true,
    type: 'string',
  },
  {
    label: 'style',
    optional: true,
    type: 'object',
  },
  {
    label: 'width',
    optional: true,
    type: 'CSS.Properties',
    comment:
      'It must be a valid CSS object; your IDE should help you for the validation. See https://www.npmjs.com/package/csstype',
  },
];

const LoaderGuide: React.FC = () => {
  return (
    <div>
      <h2>Loader</h2>

      <p>
        The Loader can be used in a small space (like a button) on for an entire
        view.
      </p>

      <h3>Examples</h3>

      <Example
        code={`import Loader from 'uiComponents/Loader';

<Loader />`}
      >
        <Loader />
      </Example>

      <Example
        code={`import Loader from 'uiComponents/Loader';

<Loader label="A small sublabel" color="#c00" width={100} />`}
      >
        <Loader label="A small sublabel" color="#c00" width={100} />
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default LoaderGuide;
