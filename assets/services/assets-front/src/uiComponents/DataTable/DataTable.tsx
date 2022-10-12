import React, { useState } from 'react';
import CSS from 'csstype';

import Loader from 'uiComponents/Loader';
import Icon from 'uiComponents/Icon';
import { mdiChevronUp, mdiChevronDown, mdiUnfoldMoreHorizontal } from '@mdi/js';

import Pagination from '../Pagination';

import StyledDataTable from './StyledDataTable';

interface IHeaderCell {
  readonly content: string | number | React.ReactElement;
  readonly sortable?: boolean;
}

interface IBodyCell {
  readonly content: string | number | React.ReactElement;
  readonly isLoading?: boolean;
  readonly noCrop?: boolean;
  readonly sortingValue?: string | number | Date;
  readonly title?: string;
}

export interface IDataTableData {
  readonly header: Array<IHeaderCell>;
  readonly rows: Array<Array<IBodyCell>>;
}

interface IProps {
  readonly className?: string;
  readonly data: IDataTableData;
  readonly id?: string;
  readonly rowsPerPage?: number;
  readonly style?: CSS.Properties;
}

interface IState {
  sortedOn?: number;
  sortingUpDown?: 'up' | 'down';
  currentPage: number;
}

const DataTable: React.FC<IProps> = ({
  className = '',
  data,
  id,
  style,
  rowsPerPage,
}) => {
  const [state, setState] = useState<IState>({
    currentPage: 0,
  });
  const { sortedOn, sortingUpDown, currentPage } = state;
  const sortedRows = data.rows;

  if (sortedOn !== undefined && sortedRows.length > 1) {
    sortedRows.sort(
      (rowA, rowB) =>
        (rowA[sortedOn]?.sortingValue ||
        rowA[sortedOn]?.content >
          (rowB[sortedOn]?.sortingValue || rowB[sortedOn]?.content)
          ? 1
          : -1) * (sortingUpDown === 'up' ? 1 : -1),
    );
  }

  let slicedRows = sortedRows;
  if (rowsPerPage) {
    slicedRows = sortedRows.slice(
      currentPage * rowsPerPage,
      (currentPage + 1) * rowsPerPage,
    );
  }

  return (
    <StyledDataTable className={`${className}`} id={id} style={style}>
      <table cellPadding={0} cellSpacing={0}>
        <thead>
          <tr>
            {data.header.map((cell, index) => (
              <td
                key={index}
                className={cell.sortable ? 'withSortButton' : undefined}
              >
                <div>
                  <div>{cell.content}</div>
                  {cell.sortable && (
                    <button
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          sortedOn:
                            sortedOn === index && sortingUpDown === 'down'
                              ? undefined
                              : index,
                          sortingUpDown:
                            sortedOn === index && sortingUpDown === 'up'
                              ? 'down'
                              : 'up',
                        }))
                      }
                    >
                      {sortedOn !== index && (
                        <Icon icon={mdiUnfoldMoreHorizontal} />
                      )}
                      {sortedOn === index &&
                        (sortingUpDown === 'up' ? (
                          <Icon icon={mdiChevronUp} />
                        ) : (
                          <Icon icon={mdiChevronDown} />
                        ))}
                    </button>
                  )}
                </div>
              </td>
            ))}
          </tr>
        </thead>

        <tbody>
          {slicedRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  title={cell.title || undefined}
                  className={cell.noCrop ? 'noCrop' : undefined}
                >
                  {cell.isLoading ? (
                    <div className="loaderContainer">
                      <Loader width={16} />
                    </div>
                  ) : (
                    cell.content
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {rowsPerPage && sortedRows.length > rowsPerPage && (
        <footer>
          <Pagination
            currentPage={currentPage}
            actions={new Array(Math.ceil(sortedRows.length / rowsPerPage))
              .fill('-')
              .map((_value, index) => {
                return () =>
                  setState({
                    currentPage: index,
                  });
              })}
          />
        </footer>
      )}
    </StyledDataTable>
  );
};

export default DataTable;
