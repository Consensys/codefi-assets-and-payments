import React from 'react';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

import PageError from 'uiComponents/PageError';

const properties: Array<IProperty> = [
  {
    label: 'errorCode',
    optional: true,
    type: 'string | number',
  },
  {
    label: 'errorMessage',
    optional: true,
    type: 'string',
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

const PageErrorGuide: React.FC = () => {
  return (
    <div>
      <h2>Page error</h2>

      <p>
        This component usually displays an error when the basic data for a page
        could not be loaded.
      </p>

      <h3>Examples</h3>

      <Example
        code={`import PageError from 'uiComponents/PageError';

<PageError />`}
      >
        <PageError />
      </Example>

      <Example
        code={`import PageError from 'uiComponents/PageError';

<PageError errorCode="418" errorMessage="I’m a teapot" />`}
      >
        <PageError errorCode="418" errorMessage="I’m a teapot" />
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default PageErrorGuide;
