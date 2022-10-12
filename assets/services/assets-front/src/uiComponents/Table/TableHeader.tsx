import React from 'react';
import { Arrow } from './Icons/Arrow';
import './Table.css';

export interface TableHeaderProps extends React.HtmlHTMLAttributes<any> {
  /** Is sort active */
  isSorted?: boolean;
  /** Is direction of sorting descending */
  isSortedDesc?: boolean;
  /** On Click handler */
  onClick?: () => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  isSortedDesc,
  isSorted,
  children,
  style,
  ...props
}) => {
  return (
    <div
      className={`tableHeaderColumn`}
      {...props}
      style={{
        // fontWeight: isSorted ? 'bold' : 'normal',
        ...style,
      }}
    >
      {children}{' '}
      {isSorted ? (
        isSortedDesc ? (
          <Arrow orientation={'Down'} />
        ) : (
          <Arrow orientation={'Up'} />
        )
      ) : (
        ''
      )}
    </div>
  );
};
