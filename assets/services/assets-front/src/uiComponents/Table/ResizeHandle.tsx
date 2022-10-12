import React, { ReactElement } from 'react';
import { ColumnInstance } from 'react-table';
import './Table.css';

// import { useStyles } from './TableStyles'

export const ResizeHandle = <T extends Record<string, unknown>>({
  column,
}: {
  column: ColumnInstance<T> | any;
}): ReactElement => {
  //   const classes = useStyles()
  return (
    <div
      {...column.getResizerProps()}
      style={{ cursor: 'col-resize' }} // override the useResizeColumns default
      className={`resizeHandle ${column.isResizing ? 'handleActive' : ''}`}
    />
  );
};
