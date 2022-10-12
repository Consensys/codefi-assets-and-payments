import React from 'react';
import { TableInstance } from 'react-table';
import { Dropdown, DropdownItem } from './Dropdown/Dropdown';
import { Arrow, NavigationArrow, NavigationEndArrow } from './Icons/Arrow';
import { Dots } from './Icons/Dots';
import { PaginationButton, PaginationWrapper } from './PaginationStyles';

const rowsPerPageOptions = [5, 10, 25, 50];

const SPREAD_LEFT = 'SPREAD_LEFT';
const SPREAD_RIGHT = 'SPREAD_RIGHT';

const pageRange = (from: number, to: number, step = 1, min: number) => {
  let i = from;
  const range: Array<number> = [];

  while (i <= to) {
    if (i >= min) {
      range.push(i);
    }
    i += step;
  }

  return range;
};

const fetchPageNumbers = (
  totalPages: number,
  currentPage: number,
  pageNeighbors: number,
) => {
  let pages: Array<number | string> = [];
  if (totalPages <= pageNeighbors * 2 + 4) {
    return pageRange(1, totalPages, 1, 1);
  }
  if (currentPage > pageNeighbors + 1) {
    pages = [...pages, SPREAD_LEFT];
  }
  const leftOverflow = currentPage - pageNeighbors + 1;
  const addRight = leftOverflow < 3 ? leftOverflow - 3 : 0;
  const rightOverflow = currentPage + pageNeighbors + 1;
  const addLeft =
    rightOverflow - totalPages + 2 >= 1 ? rightOverflow - totalPages + 2 : 0;
  pages = [
    ...pages,
    ...pageRange(
      leftOverflow - addLeft,
      Math.min(rightOverflow - addRight, totalPages - 1),
      1,
      2,
    ),
  ];
  if (currentPage < totalPages - pageNeighbors - 2) {
    pages = [...pages, SPREAD_RIGHT];
  }
  return [1, ...pages, totalPages];
};

const fetchRegularPageNumbers = (
  totalPages: number,
  currentPage: number,
  pageNeighbors: number,
) => {
  let pages: Array<number | string> = [];
  if (totalPages <= pageNeighbors * 2 + 1) {
    return pageRange(1, totalPages, 1, 1);
  }
  const leftOverflow = currentPage - pageNeighbors + 1;
  const addRight = leftOverflow < 1 ? leftOverflow - 1 : 0;
  const rightOverflow = currentPage + pageNeighbors + 1;
  const addLeft =
    rightOverflow - totalPages >= 1 ? rightOverflow - totalPages : 0;
  pages = pageRange(
    leftOverflow - addLeft,
    Math.min(rightOverflow - addRight, totalPages),
    1,
    1,
  );
  return pages;
};

export interface TablePaginationProps {
  instance: TableInstance;
  className?: string;
  color?: string;
  manualTotalRows?: number;
  navigationChanged?: (page: number, size: number) => void;
  PaginationCount?: React.FC<{ visible: number; total: number }>;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  instance,
  className,
  color,
  manualTotalRows,
  navigationChanged,
  PaginationCount,
}) => {
  const {
    state: { pageIndex, pageSize, rowCount = instance.rows.length },
    gotoPage,
    setPageSize,
  }: any = instance;

  const handleChangePage = React.useCallback(
    (newPage: number) => {
      gotoPage(newPage);
      navigationChanged && navigationChanged(newPage, pageSize);
    },
    [gotoPage, navigationChanged, pageSize],
  );

  const onChangeRowsPerPage = React.useCallback(
    (newRowsCount) => {
      gotoPage(0);
      setPageSize(newRowsCount);
      navigationChanged && navigationChanged(0, newRowsCount);
    },
    [setPageSize, gotoPage, navigationChanged],
  );

  return (
    <Pagination
      rowsPerPageOptions={rowsPerPageOptions}
      count={manualTotalRows || rowCount}
      rowsPerPage={pageSize}
      page={pageIndex}
      regularArrows={true}
      onChangePage={handleChangePage}
      onChangeRowsPerPage={onChangeRowsPerPage}
      className={className}
      color={color}
      PaginationCount={PaginationCount}
    />
  );
};

export interface PaginationProps {
  rowsPerPageOptions: Array<number>;
  count: number;
  rowsPerPage: number;
  page: number;
  useDots?: boolean;
  regularArrows?: boolean;
  color?: string;
  onChangePage: (newPage: number) => void;
  onChangeRowsPerPage: (newRowsPerPageCount: number) => void;
  className?: string;
  PaginationCount?: React.FC<{ visible: number; total: number }>;
}

export const Pagination: React.FC<PaginationProps> = ({
  rowsPerPageOptions,
  count,
  rowsPerPage,
  page,
  regularArrows,
  onChangePage,
  onChangeRowsPerPage,
  useDots,
  className,
  color: tempColor,
  PaginationCount,
}) => {
  const pagesTotal = Math.ceil(count / rowsPerPage);
  const pages = regularArrows
    ? fetchRegularPageNumbers(pagesTotal, page, 2)
    : fetchPageNumbers(pagesTotal, page, 1);
  const color = tempColor || '#1a5afe';
  return (
    <PaginationWrapper
      className={`paginationWrapper ${className}`}
      color={color}
    >
      <div className="rowsNumberSelect">
        <span style={{ marginRight: '8px' }}>
          {PaginationCount ? (
            <PaginationCount
              visible={Math.min(count - rowsPerPage * page, rowsPerPage)}
              total={count}
            />
          ) : (
            <>
              {Math.min(count - rowsPerPage * page, rowsPerPage)} / {count}
            </>
          )}
        </span>
        <Dropdown<DropdownItem>
          items={rowsPerPageOptions.map((el) => ({ value: el }))}
          renderItemName={(item) => <span>{item.value}</span>}
          name=""
          defaultValue={[rowsPerPage]}
          onSelectChange={(newVal) => onChangeRowsPerPage(+newVal[0].value)}
          isOutlined={true}
          position="top"
        />
      </div>
      <div className="paginationNumbersWrapper">
        {!regularArrows && (
          <>
            {useDots && (
              <PaginationButton
                color={color}
                onClick={() => onChangePage(page - 1)}
              >
                <Arrow orientation="Left" />
              </PaginationButton>
            )}
            {pages.map((pageItem, index) => {
              if (
                (pageItem === SPREAD_RIGHT || pageItem === SPREAD_LEFT) &&
                useDots
              ) {
                return (
                  <PaginationButton color={color} noEvents={true}>
                    <Dots />
                  </PaginationButton>
                );
              }
              if (pageItem === SPREAD_LEFT) {
                return (
                  <PaginationButton
                    color={color}
                    onClick={() => onChangePage(page - 1)}
                  >
                    <Arrow orientation="Left" />
                  </PaginationButton>
                );
              }
              if (pageItem === SPREAD_RIGHT) {
                return (
                  <PaginationButton
                    color={color}
                    onClick={() => onChangePage(page + 1)}
                  >
                    <Arrow orientation="Right" />
                  </PaginationButton>
                );
              }
              return (
                <PaginationButton
                  key={index}
                  color={color}
                  className={`${pageItem === page + 1 && 'active'}`}
                  onClick={() => onChangePage(+pageItem - 1)}
                >
                  {pageItem}
                </PaginationButton>
              );
            })}
            {useDots && (
              <PaginationButton
                color={color}
                onClick={() => onChangePage(page + 1)}
              >
                <Arrow orientation="Right" />
              </PaginationButton>
            )}
          </>
        )}
        {regularArrows && (
          <>
            <PaginationButton
              key={'page-first'}
              color={color}
              className={`${page === 0 && 'disabled'}`}
              onClick={() => onChangePage(0)}
            >
              <NavigationEndArrow orientation="Left" />
            </PaginationButton>
            <PaginationButton
              key={'page-prev'}
              color={color}
              className={`${page === 0 && 'disabled'}`}
              onClick={() => onChangePage(page - 1)}
            >
              <NavigationArrow orientation="Left" />
            </PaginationButton>
            {pages.map((pageItem) => (
              <PaginationButton
                key={`page-${pageItem}`}
                color={color}
                className={`${pageItem === page + 1 && 'active'}`}
                onClick={() => onChangePage(+pageItem - 1)}
              >
                {pageItem}
              </PaginationButton>
            ))}
            <PaginationButton
              key={'page-next'}
              color={color}
              className={`${page === pagesTotal - 1 && 'disabled'}`}
              onClick={() => onChangePage(page + 1)}
            >
              <NavigationArrow orientation="Right" />
            </PaginationButton>
            <PaginationButton
              key={'page-last'}
              color={color}
              className={`${page === pagesTotal - 1 && 'disabled'}`}
              onClick={() => onChangePage(pagesTotal - 1)}
            >
              <NavigationEndArrow orientation="Right" />
            </PaginationButton>
          </>
        )}
      </div>
    </PaginationWrapper>
  );
};
