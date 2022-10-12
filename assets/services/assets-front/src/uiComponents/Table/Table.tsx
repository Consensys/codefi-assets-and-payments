/* eslint react/jsx-key: 0 */
import React from 'react';
import {
  useTable,
  useColumnOrder,
  useFilters,
  useGroupBy,
  useSortBy,
  useExpanded,
  useFlexLayout,
  usePagination,
  useResizeColumns,
  useRowSelect,
  HeaderGroup,
  useGlobalFilter,
  UseExpandedOptions,
  UseFiltersOptions,
  UseGroupByOptions,
  UsePaginationOptions,
  UseRowSelectOptions,
  UseSortByOptions,
  UseResizeColumnsOptions,
} from 'react-table';
import { useSticky } from 'react-table-sticky';
import { useExportData } from 'react-table-plugins';
import { Overlay } from 'react-portal-overlay';
import { ResizeHandle } from './ResizeHandle';
import { TableHeader } from './TableHeader';
import './Table.css';
import { TablePagination } from './Pagination';
import { Export } from './Icons/Export';
import Papa from 'papaparse';
import { PaginationButton } from './PaginationStyles';
import { NoData } from './Icons/NoData';
import Loader from './Loader/Loader';
import { Settings } from './Icons/Settings';
import Board from './Board/Board';
import { Drag } from './Icons/Drag';
import { Checkbox } from './Checkbox/Checkbox';
import { Close } from './Icons/Close';
import { Dropdown, DropdownItem } from './Dropdown';
import { TablePopup, TableWrapper } from './TableStyles';

export interface TableTranslations {
  loadingText?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  configureTableTitle?: string;
  configureTableDescription?: string;
  freezeColumns?: string;
  freezeNoColumns?: string;
  freezeOneColumn?: string;
  freezeTwoColumn?: string;
  freezeTreeColumn?: string;
  cancelConfigureTableChange?: string;
  saveConfigureTableChange?: string;
  tableFiltersClear?: string;
  resetColumns?: string;
}
export interface FilterType {
  id: string;
  value: Array<string>;
}
export interface SortBy {
  id: string;
  desc: boolean;
}
export interface TableFetchDataType {
  pageIndex: number;
  pageSize: number;
  sortBy: Array<SortBy>;
  filters: Array<FilterType>;
}
type ObjectOf<T> = { [P in keyof T]: T[P] };
export interface TableOptions<D extends ObjectOf<D>>
  extends UseExpandedOptions<D>,
    UseFiltersOptions<D>,
    UseGroupByOptions<D>,
    UsePaginationOptions<D>,
    UseRowSelectOptions<D>,
    UseSortByOptions<D>,
    UseFiltersOptions<D>,
    UseResizeColumnsOptions<D>,
    Record<string, any> {}
export interface ManualPagination {
  totalRows: number;
  pageSize: number;
  currentPage: number;
}
export interface TableProps<T extends Record<string, unknown>>
  extends TableOptions<T> {
  defaultFreezeColumnsCount?: number;
  freezeColumnsCount?: number;
  color?: string;
  isLoading?: boolean;
  getExportFileBlob?: any;
  defaultColumnsHidden?: Array<string>;
  defaultColumnsOrder?: Array<string>;
  initialColumnsHidden?: Array<string>;
  initialColumnsOrder?: Array<string>;
  onColumnsChange?: (
    newOrder: Array<string>,
    newHidden: Array<string>,
    freezeCount: number,
  ) => void;
  SelectedItemsActions?: React.FC<{ selectedItems: Array<any> }>;
  PaginationCount?: React.FC<{ visible: number; total: number }>;
  selectable?: boolean;
  translations?: TableTranslations;
  serverSidePagination?: ManualPagination;
  fetchData?: (data: TableFetchDataType) => void;
  hidePagination?: boolean;
  TableTitle?: string | React.FC;
}

interface TableHeaderProps<T extends Record<string, unknown>>
  extends HeaderGroup<T> {
  isResizing?: boolean;
  canSort?: boolean;
  canResize?: boolean;
  canFilter?: boolean;
  isSorted?: boolean;
  isSortedDesc?: boolean;
  getSortByToggleProps?: any;
  filter?: any;
  reorderName?: string;
  disableReorder?: boolean;
  noPadding?: boolean;
}

interface OptionItem extends DropdownItem {
  title: string;
}

function getExportFileBlob({ columns, data, fileType }: any) {
  if (fileType === 'csv') {
    // CSV
    const headerNames = columns.map((col: any) => col.exportValue);
    const csvString = Papa.unparse({ fields: headerNames, data });
    return new Blob([csvString], { type: 'text/csv' });
  }
  return false;
}

export function Table<T extends Record<string, unknown>>(
  props: React.PropsWithChildren<TableProps<T>>,
): React.ReactElement {
  const {
    columns,
    data,
    color,
    isLoading,
    translations,
    defaultColumnsHidden,
    defaultColumnsOrder,
    initialColumnsHidden,
    initialColumnsOrder,
    SelectedItemsActions,
    selectable,
    freezeColumnsCount,
    defaultFreezeColumnsCount,
    onColumnsChange,
    serverSidePagination,
    fetchData,
    PaginationCount,
    hidePagination,
    TableTitle,
    ...rest
  } = props;

  const mainColor = color || '#1a5afe';

  const [stickyColumns, setStickyColumns] = React.useState(
    freezeColumnsCount || defaultFreezeColumnsCount || 0,
  );
  const [tempStickyColumns, setTempStickyColumns] = React.useState(
    freezeColumnsCount || defaultFreezeColumnsCount || 0,
  );

  const [loading, setLoading] = React.useState(false);

  const loadCount: { current: number } = React.useRef(0);

  const timer: { current: NodeJS.Timeout | null } = React.useRef(null);
  React.useEffect(() => {
    clearTimeout(timer.current as NodeJS.Timeout);
    if (isLoading) {
      if (loadCount.current === 0) {
        setLoading(true);
      } else {
        timer.current = setTimeout(() => {
          setLoading(true);
        }, 500);
      }
      loadCount.current = loadCount.current + 1;
    } else {
      timer.current = setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [isLoading]);

  const tableSettings = React.useMemo(() => {
    const tableConfig = {
      columns,
      data,
      getExportFileBlob,
      initialState: {
        hiddenColumns: initialColumnsHidden || defaultColumnsHidden || [],
      },
      manualPagination: !!serverSidePagination,
      ...rest,
    } as any;

    if (!!serverSidePagination) {
      tableConfig.initialState.pageIndex = 0;
      tableConfig.pageCount = Math.ceil(
        serverSidePagination.totalRows / serverSidePagination.pageSize,
      );
    }
    return tableConfig;
  }, [
    serverSidePagination,
    data,
    columns,
    defaultColumnsHidden,
    initialColumnsHidden,
    rest,
  ]);

  const instance = useTable(
    tableSettings,
    useColumnOrder,
    useFilters,
    useGlobalFilter,
    useGroupBy,
    useSortBy,
    useExpanded,
    useFlexLayout,
    usePagination,
    useResizeColumns,
    useRowSelect,
    useExportData,
    useRowSelect,
    (hooks) => {
      hooks.visibleColumns.push((columns) => [
        ...(selectable
          ? [
              {
                id: 'selectionRow',
                Header: ({ getToggleAllPageRowsSelectedProps }: any) => (
                  <IndeterminateCheckbox
                    color={mainColor}
                    {...getToggleAllPageRowsSelectedProps()}
                    style={{ margin: '0 -8px -8px -8px' }}
                  />
                ),
                Cell: ({ row }: any) => {
                  return (
                    <IndeterminateCheckbox
                      color={mainColor}
                      disabled={row.original.disableRowToggle}
                      {...row.getToggleRowSelectedProps()}
                      style={{ marginLeft: '8px' }}
                    />
                  );
                },
                minWidth: 36,
                width: 36,
                sticky: 'left',
                disableResizing: true,
                noPadding: true,
              },
            ]
          : []),
        ...columns.map((el) => ({ ...el, sticky: 'left' })),
      ]);
    },
    useSticky,
  );
  const {
    getTableProps,
    headerGroups,
    getTableBodyProps,
    page,
    prepareRow,
    exportData,
    setColumnOrder,
    allColumns,
    headers,
    setAllFilters,
    selectedFlatRows,
    state: { pageIndex, pageSize, sortBy, filters },
    gotoPage,
  }: any = instance;

  React.useEffect(() => {
    const newColumnsOrder = initialColumnsOrder || defaultColumnsOrder;
    newColumnsOrder && setColumnOrder(newColumnsOrder);
  }, [defaultColumnsOrder, initialColumnsOrder, setColumnOrder]);
  const firstUpdate = React.useRef(true);
  const firstFilterUpdate = React.useRef(true);
  const [filterUpdate, setFilterUpdate] = React.useState(0);
  React.useEffect(() => {
    if (firstFilterUpdate.current) {
      firstFilterUpdate.current = false;
      return;
    }
    if (pageIndex !== 0) {
      gotoPage(0);
    } else {
      setFilterUpdate(filterUpdate + 1);
    }
    // eslint-disable-next-line
  }, [filters]);
  React.useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    fetchData &&
      fetchData({
        pageIndex,
        pageSize,
        sortBy,
        filters,
      });
      // eslint-disable-next-line
  }, [pageIndex, pageSize, sortBy, filterUpdate]);

  const [showModal, setShowModal] = React.useState(false);
  const [columnsOrdered, setColumnsOrdered] = React.useState(allColumns);

  const updateColumns = () => {
    const newOrder = columnsOrdered.map((column: any) => column.id);
    const newHidden = columnsOrdered.reduce((old: any, next: any) => {
      if (!next.isVisible) {
        return [...old, next.id];
      }
      return old;
    }, []);
    setColumnOrder(newOrder);
    setStickyColumns(tempStickyColumns);
    columnsOrdered.forEach((column: any) => {
      if (
        column.previousVisible !== undefined &&
        column.isVisible !== column.previousVisible
      ) {
        column.toggleHidden();
      }
    });
    onColumnsChange && onColumnsChange(newOrder, newHidden, tempStickyColumns);
    setShowModal(false);
  };

  const resetColumns = () => {
    setStickyColumns(defaultFreezeColumnsCount || 0);
    setColumnOrder(defaultColumnsOrder);
    columnsOrdered.forEach((column: any) => {
      if (defaultColumnsHidden?.includes(column.id)) {
        if (column.isVisible) {
          column.toggleHidden();
        }
      } else {
        if (!column.isVisible) {
          column.toggleHidden();
        }
      }
    });
    setShowModal(false);
  };

  const filterElements = headers
    .filter((column: TableHeaderProps<any>) => {
      if (!column.filter) {
        return false;
      }
      if (!column.canFilter) {
        return false;
      }
      return true;
    })
    .map((column: TableHeaderProps<any>) => {
      switch (column.filter) {
        case tableFilterOptions:
          return (
            <TableFilterTypeOptions
              key={`filter-${column.id}`}
              {...column}
              color={mainColor}
            />
          );
        default:
          return column.render('Filter');
      }
    });

  return (
    <TableWrapper>
      <Overlay
        open={showModal}
        onClose={() => {
          setShowModal(false);
        }}
        style={{
          background: 'rgba(0, 10, 40, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'none',
        }}
      >
        <TablePopup>
          <div className="tablePopupHeader">
            {translations?.configureTableTitle || 'Configure table'}
            <PaginationButton
              color={mainColor}
              onClick={() => {
                setShowModal(false);
              }}
            >
              <Close color={mainColor} />
            </PaginationButton>
          </div>
          <div className="tablePopupContent">
            <div style={{ padding: '16px 22px' }}>
              {translations?.configureTableDescription ||
                'Configure the table by selecting what information is to be shown, freeze specific columns and re-order the columns.'}
            </div>
            <div
              className="clearButton"
              style={{ color: mainColor, padding: '0 22px' }}
              onClick={() => {
                resetColumns();
              }}
            >
              {translations?.resetColumns || 'Reset to default configuration'}
            </div>
            <Board
              fullWidth
              disableColumnDrag
              initial={{
                availableColumns: allColumns
                  .filter(
                    (el: any) => el.id !== 'selectionRow' && !el.disableReorder,
                  )
                  .map((col: any) => ({
                    id: col.id,
                    title: col.reorderName || col.Header,
                    content: col,
                    visible: col.isVisible,
                  })),
              }}
              options={{
                availableColumns: {
                  color: mainColor,
                  lightColor: 'rgba(247, 142, 143, 0.2)',
                  title: 'Available options',
                  noBorder: true,
                },
              }}
              itemsOrderChanged={(newOrder) =>
                setColumnsOrdered(
                  newOrder.availableColumns.map((el: any) => ({
                    ...el.content,
                    previousVisible: el.content.isVisible,
                    isVisible: el.visible,
                  })),
                )
              }
              ColumnHeader={() => ''}
              ItemComponent={(props) => (
                <div className="tablePopupOrderItem">
                  <Checkbox
                    color={mainColor}
                    checked={props.item.visible}
                    onToggle={(visible) => {
                      const updatedItem = {
                        ...props.item,
                        visible,
                      };
                      props.updateItem(updatedItem);
                    }}
                  />
                  <div style={{ flexGrow: 1, padding: '0 8px' }}>
                    {props.item.title}
                  </div>
                  <div
                    style={{ width: '20px', height: '20px' }}
                    {...props.dragHandleProps}
                  >
                    <Drag />
                  </div>
                </div>
              )}
            />
            <span style={{ padding: '16px 22px' }}>
              {translations?.freezeColumns || 'Freeze Columns'}
            </span>
            <Dropdown<OptionItem>
              items={[
                {
                  value: 0,
                  title: translations?.freezeNoColumns || 'No Columns',
                },
                {
                  value: 1,
                  title: translations?.freezeOneColumn || '1 Column',
                },
                {
                  value: 2,
                  title: translations?.freezeTwoColumn || '2 Columns',
                },
                {
                  value: 3,
                  title: translations?.freezeTreeColumn || '3 Columns',
                },
              ]}
              renderItemName={(item) => <span>{item.title}</span>}
              name=""
              defaultValue={[tempStickyColumns]}
              onSelectChange={(newVal) =>
                setTempStickyColumns(+newVal[0].value)
              }
              isOutlined={true}
              position="top"
            />
          </div>
          <div className="tablePopupFooter">
            <div
              className="cancelButton"
              style={{ color: mainColor }}
              onClick={() => {
                setShowModal(false);
              }}
            >
              {translations?.cancelConfigureTableChange || 'Cancel'}
            </div>
            <div
              className="saveButton"
              style={{ background: mainColor }}
              onClick={() => {
                updateColumns();
              }}
            >
              {translations?.saveConfigureTableChange || 'Save'}
            </div>
          </div>
        </TablePopup>
      </Overlay>
      <div className="preTableContainer">
        <div className="titleAndFilters">
          {TableTitle && (
            <div className="tableTop">
              {typeof TableTitle === 'string' ? (
                <div>{TableTitle}</div>
              ) : (
                <TableTitle />
              )}
            </div>
          )}
          <div className="tableFilters">
            {SelectedItemsActions && selectedFlatRows.length > 0 ? (
              <>
                <SelectedItemsActions
                  selectedItems={selectedFlatRows.map((el: any) => el.original)}
                />
              </>
            ) : (
              filterElements.length > 0 && (
                <>
                  {filterElements}
                  <div
                    className="clearButton"
                    style={{ color: mainColor }}
                    onClick={() => {
                      setAllFilters([]);
                    }}
                  >
                    {translations?.tableFiltersClear || 'Clear filters'}
                  </div>
                </>
              )
            )}
          </div>
        </div>
        <div className="tableActions">
          <PaginationButton
            color={mainColor}
            onClick={() => {
              exportData('csv', false);
            }}
          >
            <Export color={mainColor} />
          </PaginationButton>
          <PaginationButton
            color={mainColor}
            onClick={() => {
              setTempStickyColumns(stickyColumns);
              setShowModal(true);
            }}
          >
            <Settings color={mainColor} />
          </PaginationButton>
        </div>
      </div>
      <div className="table sticky" {...getTableProps()}>
        <div className="header">
          {headerGroups.map((headerGroup: any, index: number) => (
            <div
              key={index}
              {...headerGroup.getHeaderGroupProps()}
              className="tr"
            >
              {headerGroup.headers.map(
                (column: TableHeaderProps<any>, index: number) => {
                  const headerProps = column.getHeaderProps();
                  const stickUntil =
                    selectable && stickyColumns > 0
                      ? stickyColumns
                      : stickyColumns - 1;
                  return (
                    <div
                      className={`th ${column.isResizing ? 'resizing' : ''}`}
                      data-sticky-td={index <= stickUntil}
                      data-sticky-last-left-td={index === stickUntil}
                      {...headerProps}
                      style={{
                        ...headerProps.style,
                        ...(index > stickUntil
                          ? {
                              position: 'relative',
                              left: 0,
                            }
                          : {}),
                        zIndex: index <= stickUntil ? 3 : 'inherit',
                      }}
                    >
                      {column.canSort ? (
                        <TableHeader
                          isSorted={column.isSorted}
                          isSortedDesc={column.isSortedDesc}
                          {...column.getSortByToggleProps()}
                        >
                          {column.render('Header')}
                        </TableHeader>
                      ) : (
                        <div className="notSortable">
                          {column.render('Header')}
                        </div>
                      )}
                      {column.canResize && <ResizeHandle column={column} />}
                    </div>
                  );
                },
              )}
            </div>
          ))}
        </div>
        <div
          className={`body ${
            instance.rows.length === 0 || loading ? 'bodyEmpty' : ''
          } ${isLoading || loading ? 'hideTable' : ''} ${
            loadCount.current < 1 ? 'preventFade' : ''
          }`}
          {...getTableBodyProps()}
        >
          {(loading ? [] : page).map((row: any) => {
            prepareRow(row);
            const rowProps = row.getRowProps();
            return (
              <div
                className={`tr ${row.isSelected ? 'tableRowSelected' : ''}`}
                {...rowProps}
              >
                {row.cells.map((cell: any, index: number) => {
                  const cellProps = cell.getCellProps();
                  const stickUntil =
                    selectable && stickyColumns > 0
                      ? stickyColumns
                      : stickyColumns - 1;
                  return (
                    <div
                      className={`td ${
                        cell.column.id === 'selectionRow' ? 'selectionCell' : ''
                      }`}
                      {...cellProps}
                      style={{
                        ...cellProps.style,
                        position: index <= stickUntil ? 'sticky' : 'inherit',
                        zIndex: index <= stickUntil ? 3 : 'inherit',
                        ...{
                          background: row.isSelected ? mainColor : 'white',
                        },
                      }}
                      data-sticky-td={index <= stickUntil}
                      data-sticky-last-left-td={index === stickUntil}
                    >
                      <div
                        className={`td-content ${
                          !cell.column.noPadding ? 'td-default-renderer' : ''
                        }`}
                      >
                        {cell.isAggregated
                          ? cell.render('Aggregated')
                          : cell.isPlaceholder
                          ? null
                          : cell.render('Cell')}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      {!loading && instance.rows.length === 0 && (
        <div className="emptyTable">
          <NoData color={mainColor} />
          <div className="emptyTableTitle" style={{ color: mainColor }}>
            {translations?.emptyTitle || 'No entries'}
          </div>
          <div className="emptyTableBody">
            {translations?.emptyDescription ||
              'There is no data to populate this table'}
          </div>
        </div>
      )}
      {loading && (
        <div className="emptyTable">
          <Loader color={mainColor} />
          <div className="emptyTableBody">
            {translations?.loadingText || 'Loading table...'}
          </div>
        </div>
      )}
      {!hidePagination && (
        <TablePagination
          className="tablePagination"
          instance={instance}
          color={mainColor}
          manualTotalRows={serverSidePagination?.totalRows}
          PaginationCount={PaginationCount}
        />
      )}
    </TableWrapper>
  );
}

export const tableFilterOptions = (
  rows: Array<any>,
  columnIds: string,
  filterValue: Array<string | number>,
): Array<any> => {
  return filterValue.length === 0
    ? rows
    : rows.filter((row) =>
        filterValue.includes(String(row.original[columnIds])),
      );
};

const IndeterminateCheckbox = ({
  indeterminate,
  color,
  checked,
  style,
  disabled,
  ...rest
}: any) => (
  <Checkbox
    checked={checked}
    color={disabled ? 'gray' : color}
    indeterminate={indeterminate}
    onToggle={(e) => {
      if (disabled) {
        return;
      }
      rest.onChange({
        target: {
          checked: e,
        },
      });
    }}
    style={{
      ...style,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  />
);

const TableFilterTypeOptions = (column: any) => {
  const items = React.useMemo(
    () =>
      column.filterValues.map((el: any) => {
        if (el && el.value && el.title) {
          return el;
        }
        return { value: el, title: el };
      }),
    [column.filterValues],
  );
  return (
    <Dropdown<OptionItem>
      name={column.render('Header')}
      items={items}
      value={column.filterValue || []}
      isMultiSelect={true}
      renderItemName={(item) => <>{item.title}</>}
      onSelectChange={(items) => {
        column.setFilter(items.map((item) => item.value));
      }}
      className="tableFilterItem"
      highlightTitle
      color={column.color}
    />
  );
};
