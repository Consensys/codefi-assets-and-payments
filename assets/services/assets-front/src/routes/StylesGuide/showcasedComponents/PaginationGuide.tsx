import React from 'react';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

import Pagination from 'uiComponents/Pagination';

const properties: Array<IProperty> = [
  {
    label: 'actions',
    optional: true,
    type: 'Array<string | (() => void)>',
  },
  {
    label: 'currentPage',
    optional: true,
    type: 'number',
    comment:
      'Zero indexed. Cannot be under zero. Cannot be over the actions length.',
  },
  {
    label: 'className',
    optional: true,
    type: ' string',
  },
  {
    label: 'id',
    optional: true,
    type: ' string',
  },
  {
    label: 'style',
    optional: true,
    type: ' CSS.Properties',
  },
];

const PaginationGuide: React.FC = () => {
  return (
    <div>
      <h2>Pagination</h2>

      <p>A Pagination component.</p>

      <h3>Examples</h3>

      <Example
        code={`import Pagination from 'uiComponents/Pagination';

<p>Pagination with links</p>
<Pagination
  currentPage={8}
  actions={[
    '#',
    '#',
    '#',
    '#',
    '#',
    '#',
    '#',
    '#',
    '#',
    '#',
    '#',
    '#',
    '#',
    '#',
    '#',
    '#',
    '#',
    '#',
  ]}
/>

<p>Pagination with functions</p>
<Pagination
  currentPage={3}
  actions={[
    () => alert('1'),
    () => alert('2'),
    () => alert('3'),
    () => alert('4'),
    () => alert('5'),
    () => alert('6'),
    () => alert('7'),
    () => alert('8'),
    () => alert('9'),
    () => alert('10'),
    () => alert('11'),
  ]}
/>`}
      >
        <p>Pagination with links</p>
        <Pagination
          currentPage={8}
          actions={[
            '#',
            '#',
            '#',
            '#',
            '#',
            '#',
            '#',
            '#',
            '#',
            '#',
            '#',
            '#',
            '#',
            '#',
            '#',
            '#',
            '#',
            '#',
          ]}
        />

        <p>Pagination with functions</p>
        <Pagination
          currentPage={3}
          actions={[
            () => alert('1'),
            () => alert('2'),
            () => alert('3'),
            () => alert('4'),
            () => alert('5'),
            () => alert('6'),
            () => alert('7'),
            () => alert('8'),
            () => alert('9'),
            () => alert('10'),
            () => alert('11'),
          ]}
        />
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default PaginationGuide;
