import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from 'uiComponents/Icon';
import { mdiArrowRight } from '@mdi/js';
import CSS from 'csstype';
import { colors } from 'constants/styles';
import Pagination from 'uiComponents/Pagination';
import Select from 'uiComponents/Select';
import StyledPaginatedDataListCard from './StyledPaginatedDataListCard';

interface ITableCell {
  style: CSS.Properties;
  element: React.ReactNode;
}

interface IProps {
  readonly title?: string;
  readonly filteredColums?: Array<string>;
  readonly topLink?: {
    label: string;
    href: string;
  };
  readonly colHeaders: Array<string>;
  readonly rows: Array<Array<React.ReactNode | string | ITableCell>>;
  readonly emptyStateComponent?: React.ReactNode;
  readonly actionComponent?: React.ReactNode;
  readonly pagination?: {
    actions: Array<() => void>;
    currentPage: number;
    pageSize?: {
      sizes: Array<string>;
      size: number;
      total: number;
      callback: (size: number) => void;
    };
  };
}

interface IState {
  filteredColumns: {
    [headerKey: string]: string;
  };
  headerFilters: {
    [headerKey: string]: string;
  };
}

export const PaginatedDataListCard: React.FC<IProps> = ({
  title,
  topLink,
  colHeaders,
  rows,
  pagination,
  filteredColums = [],
  emptyStateComponent,
  actionComponent,
}) => {
  const [state, setState] = useState<IState>({
    filteredColumns: {},
    headerFilters: {},
  });

  const setHeaderFilter = (value: string, filterKey: string) => {
    const filterIndex = colHeaders.findIndex(
      (column: string) => filterKey === column,
    );

    const headerFilters = { ...state.headerFilters };
    if (value === '__all__') {
      delete headerFilters[filterIndex];
    } else {
      headerFilters[filterIndex] = value;
    }

    setState((s) => ({
      ...s,
      headerFilters,
    }));
  };

  const { headerFilters } = state;

  let filteredRows = rows;
  if (Object.values(headerFilters).length > 0) {
    filteredRows = filteredRows.filter((row) => {
      for (const entry of Object.entries(headerFilters)) {
        if (typeof row[parseInt(entry[0], 10)] === 'string') {
          return row[parseInt(entry[0], 10)] === entry[1];
        } else if (typeof row[parseInt(entry[0], 10)] === 'object') {
          return (
            ((row[parseInt(entry[0], 10)] as { [key: string]: any }).props
              .children || '') === entry[1]
          );
        }
        return false;
      }
      return true;
    });
  }

  const filters: Array<{
    key: string;
    placeholder: string;
    values: Array<{
      value: string;
      label: string;
    }>;
  }> = filteredColums.map((column) => {
    const keyIndex = colHeaders.findIndex((value) => value === column);
    const uniqValues = Array.from(
      new Set(
        rows.map((row) => {
          if (typeof row[keyIndex] === 'string') {
            return String(row[keyIndex]);
          } else if (typeof row[keyIndex] === 'object') {
            return (
              (row[keyIndex] as { [key: string]: any }).props.children || ''
            );
          }
          return '';
        }),
      ),
    );
    return {
      key: colHeaders[keyIndex],
      placeholder: `${colHeaders[keyIndex]}: All`,
      values: [
        {
          value: '__all__',
          label: `${colHeaders[keyIndex]}: All`,
        },
        ...(uniqValues as Array<string>).map((value) => ({
          value,
          label: `${colHeaders[keyIndex]}: ${value}`,
        })),
      ],
    };
  });

  return (
    <StyledPaginatedDataListCard>
      <header>
        {title && <h2>{title}</h2>}
        {actionComponent && <>{actionComponent}</>}
        {topLink && (
          <Link
            to={topLink.href}
            style={{
              color: colors.main,
            }}
          >
            {topLink.label}{' '}
            <Icon icon={mdiArrowRight} width={16} color={colors.main} />
          </Link>
        )}
      </header>

      {rows.length === 0 && emptyStateComponent && <>{emptyStateComponent}</>}

      {rows.length === 0 && !emptyStateComponent && (
        <>
          <div className="emptyState">
            <h2>No {title}</h2>
          </div>
        </>
      )}

      {rows.length > 0 && (
        <>
          {filters && filters.length > 0 && (
            <div className="filters">
              {filters.map((filter) => (
                <Select
                  key={filter.key}
                  options={filter.values}
                  placeholder={filter.placeholder}
                  onChange={(value) => setHeaderFilter(value, filter.key)}
                  className="filterSelect"
                />
              ))}
            </div>
          )}

          <table cellPadding="0" cellSpacing="0">
            <thead>
              <tr>
                {colHeaders.map((colHeader) => (
                  <td key={colHeader}>{colHeader}</td>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => {
                    if (typeof cell === 'object') {
                      const { style, element } = cell as ITableCell;
                      if (style && element) {
                        return (
                          <td key={cellIndex} style={style}>
                            <div>
                              <div>{colHeaders[cellIndex]}</div>
                              <div>{element}</div>
                            </div>
                          </td>
                        );
                      }
                    }
                    return (
                      <td key={cellIndex}>
                        <div>
                          <div>{colHeaders[cellIndex]}</div>
                          <div>{cell}</div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {pagination && (
            <footer>
              <div className="selectRowsPerPage">
                <span>{`Showing ${
                  (pagination.pageSize || {}).size || filteredRows.length
                } of ${
                  (pagination.pageSize || {}).total || filteredRows.length
                } elements`}</span>
                {pagination.pageSize && (
                  <Select
                    options={pagination.pageSize.sizes}
                    defaultValue={String(pagination.pageSize.size)}
                    onChange={(value) =>
                      pagination.pageSize?.callback(parseInt(value, 10))
                    }
                  />
                )}
              </div>

              <Pagination
                currentPage={pagination.currentPage}
                actions={pagination.actions}
              />
            </footer>
          )}
        </>
      )}
    </StyledPaginatedDataListCard>
  );
};
