import React from 'react';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

import PageLoader from 'uiComponents/PageLoader';

const properties: Array<IProperty> = [
  {
    label: 'label',
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

const PageLoaderGuide: React.FC = () => {
  return (
    <div>
      <h2>Page loader</h2>

      <p>
        A simple page loader that should be displayed when the important data
        for a view are not set yet.
      </p>

      <h3>Examples</h3>

      <Example
        code={`import PageLoader from 'uiComponents/PageLoader';

<PageLoader />

<PageLoader label="This is a custom loading label" />`}
      >
        <PageLoader />

        <PageLoader label="This is a custom loading label" />
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default PageLoaderGuide;
