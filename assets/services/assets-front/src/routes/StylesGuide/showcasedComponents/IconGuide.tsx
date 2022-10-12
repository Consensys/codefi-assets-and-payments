import React from 'react';
import { mdiAccountCircle } from '@mdi/js';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

import Icon from 'uiComponents/Icon';

const properties: Array<IProperty> = [
  {
    label: 'className',
    optional: true,
    type: 'string',
  },
  {
    label: 'height',
    optional: true,
    type: 'number',
    comment:
      'If you don’t specify a height, the width will be used and make a square icon. This should be the case most of the time.',
  },
  {
    label: 'icon',
    type: 'string',
    comment: 'This must be a valid svg path.',
  },
  {
    label: 'color',
    optional: true,
    type: 'string',
    comment: 'Ths must be a valid color string.',
    example: '#0cc, rgba(120, 120, 120, 0.5)',
  },
  {
    label: 'style',
    optional: true,
    type: 'CSS.Properties',
  },
  {
    label: 'width',
    optional: true,
    type: 'number',
    defaultValue: '24',
    comment: 'The width of the svg.',
  },
];

const IconGuide: React.FC = () => {
  return (
    <div>
      <h2>Icon</h2>

      <p>
        {
          'The icon component is a simple svg. You can draw you own icon or go to https://materialdesignicons.com/. They are all already in the project. Select an icon and you’ll see the import code. ex: "import { mdiAccountBadgeAlert } from \'@mdi/js\';"'
        }
      </p>

      <h3>Examples</h3>

      <Example
        code={`import Icon from 'uiComponents/Icon';
import { mdiAccountCircle } from '@mdi/js';

<Icon icon={mdiAccountCircle} />
<Icon icon={mdiAccountCircle} width={100} color="#285ef5" />`}
      >
        <Icon icon={mdiAccountCircle} />
        <br />
        <Icon icon={mdiAccountCircle} width={100} color="#285ef5" />
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default IconGuide;
