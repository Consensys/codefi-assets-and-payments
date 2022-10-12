import React from 'react';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

import PageTitle from 'uiComponents/PageTitle';

const properties: Array<IProperty> = [
  {
    label: 'title',
    type: 'string',
  },
  {
    label: 'backlink',
    optional: true,
    type: `{
  label: stringg;
  to: string;
}`,
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

const PageTitleGuide: React.FC = () => {
  return (
    <div>
      <h2>Page title</h2>

      <p>The page title is a simple title component.</p>

      <h3>Examples</h3>

      <Example
        code={`import PageTitle from 'uiComponents/PageTitle';

<PageTitle title={'This is a title'} />`}
      >
        <PageTitle title={'This is a title'} />
      </Example>

      <Example
        code={`import PageTitle from 'uiComponents/PageTitle';

<PageTitle
  title={'This is a title'}
  backLink={{ label: 'This is a backlink', to: '#' }}
/>`}
      >
        <PageTitle
          title={'This is a title'}
          backLink={{ label: 'This is a backlink', to: '#' }}
        />
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default PageTitleGuide;
