import React from 'react';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

import Logo from 'uiComponents/Logo';

const properties: Array<IProperty> = [
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
  {
    label: 'withLabel',
    optional: true,
    type: 'number',
    comment: 'Add "CONSENSYS CodeFi" to the logo.',
  },
  {
    label: 'style',
    optional: true,
    type: 'CSS.Properties',
  },
];

const LogoGuide: React.FC = () => {
  return (
    <div>
      <h2>Logo</h2>

      <p>
        The logo is a simple svg image. You can add any style you need in the
        view SCSS.
      </p>

      <h3>Examples</h3>

      <Example
        code={`import Logo from 'uiComponents/Logo';

<Logo style={{ width: '50px' }} />
<Logo withLabel={true} />`}
      >
        <Logo style={{ width: '50px' }} />
        <br />
        <br />
        <Logo withLabel={true} />
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default LogoGuide;
