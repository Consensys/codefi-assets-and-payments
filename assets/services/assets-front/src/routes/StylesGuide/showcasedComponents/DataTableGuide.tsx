import React from 'react';

import DataTable from 'uiComponents/DataTable';

import Example from '../components/Example';
import Properties, { IProperty } from '../components/Properties';

const properties: Array<IProperty> = [
  {
    label: 'data',
    type: `{
  header: Array<{
    readonly content: string | number | React.ReactElement;
    readonly sortable?: boolean;
  }>;
  rows: Array<
    Array<{
      readonly content: string | number | React.ReactElement;
      readonly isLoading?: boolean;
      readonly noCrop?: boolean;
      readonly sortingValue?: string | number | Date;
      readonly title?: string;
    }>
  >;
}`,
    comment: `The rows and header array can technically have different lenghts, but it will lead to weird results.

header > content : the content of the cells can be a string or a react element id youf need something more complex.
header > sortable : if set to true, the colum will be sortable


row cell > content : the content of the cells can be a string or a react element id youf need something more complex.
row cell > isLoading : if set to true, the cell will contain a loader
row cell > noCrop : if set to true, the content of the cell won‘t be croped if the table is too small
row cell > sortingValue : if you want to sort the table on a colum, but the displayed value is not sortable (ex: a react element), add a sort value.
row cell > title : title of the cell
`,
  },
  {
    label: 'id',
    type: 'string',
    optional: true,
  },
  {
    label: 'className',
    type: 'string',
    optional: true,
  },
  {
    label: 'style',
    optional: true,
    type: 'CSS.Properties',
    comment:
      'It must be a valid CSS object; your IDE should help you for the validation. See https://www.npmjs.com/package/csstype',
  },
];

const DataTableGuide: React.FC = () => {
  return (
    <div>
      <h2>Datatable</h2>

      <p>
        The DataTable component is a simple container used to build more complex
        components.
      </p>

      <h3>Example</h3>

      <Example
        code={`<DataTable
  data={{
    header: [
      {
        content: 'Emails',
        sortable: true,
      },
      {
        content: 'Creation Date',
      },
      {
        content: 'Button',
        sortable: true,
      },
    ],
    rows: [
      [
        {
          content: 'user1@gmail.com',
        },
        {
          content: new Date().toLocaleDateString(),
        },
        {
          content: <button>a button 1</button>,
          sortingValue: 1,
        },
      ],
      [
        {
          content: 'user3@gmail.com',
        },
        {
          content: new Date().toLocaleDateString(),
          isLoading: true,
        },
        {
          content: <button>a button 3</button>,
          sortingValue: 3,
        },
      ],
      [
        {
          content: 'user2@gmail.com',
        },
        {
          content: new Date().toLocaleDateString(),
        },
        {
          content: <button>a button 2</button>,
          sortingValue: 2,
        },
      ],
      [
        {
          content: 'user4@gmail.com',
        },
        {
          content: new Date().toLocaleDateString(),
        },
        {
          content: <button>a button 4</button>,
          sortingValue: 4,
        },
      ],
      [
        {
          content: 'user5@gmail.com',
        },
        {
          content: new Date().toLocaleDateString(),
        },
        {
          content: <button>a button 5</button>,
          sortingValue: 5,
        },
      ],
    ],
  }}
/>`}
      >
        <DataTable
          rowsPerPage={3}
          data={{
            header: [
              {
                content: 'Emails',
                sortable: true,
              },
              {
                content: 'Creation Date',
              },
              {
                content: 'Button',
                sortable: true,
              },
            ],
            rows: [
              [
                {
                  content: 'user1@gmail.com',
                },
                {
                  content: new Date().toLocaleDateString(),
                },
                {
                  content: <button>a button 1</button>,
                  sortingValue: 1,
                },
              ],
              [
                {
                  content: 'user3@gmail.com',
                },
                {
                  content: new Date().toLocaleDateString(),
                  isLoading: true,
                },
                {
                  content: <button>a button 3</button>,
                  sortingValue: 3,
                },
              ],
              [
                {
                  content: 'user2@gmail.com',
                },
                {
                  content: new Date().toLocaleDateString(),
                },
                {
                  content: <button>a button 2</button>,
                  sortingValue: 2,
                },
              ],
              [
                {
                  content: 'user4@gmail.com',
                },
                {
                  content: new Date().toLocaleDateString(),
                },
                {
                  content: <button>a button 4</button>,
                  sortingValue: 4,
                },
              ],
              [
                {
                  content: 'user5@gmail.com',
                },
                {
                  content: new Date().toLocaleDateString(),
                },
                {
                  content: <button>a button 5</button>,
                  sortingValue: 5,
                },
              ],
            ],
          }}
        />
      </Example>

      <Properties properties={properties} />
    </div>
  );
};
export default DataTableGuide;
